/**
 * Agent Executor — the core LangGraph-style execution loop
 *
 * Flow:
 *   1. Load agent config + RAG context + conversation history
 *   2. Build system prompt with tools
 *   3. LLM decision loop (max 10 iterations):
 *      - If tool call → execute skill → feed result back → loop
 *      - If text response → output via channel → done
 *   4. Safety checks on every iteration
 *   5. Return execution result with full logs
 */

import { callAI, estimateCostINR } from '@/lib/ai/router'
import type { AIMessage, ToolCall, ToolDefinition } from '@/lib/ai/router'
import { buildSystemPrompt, formatConversationHistory } from '@/lib/ai/prompts'
import type { AgentConfig, ConversationMessage, SkillSummary } from '@/lib/ai/prompts'
import {
  runSafetyChecks,
  recordAction,
  recordCost,
  DEFAULT_SAFETY_CONFIG,
} from '@/lib/agent/safety'
import type { SafetyConfig, SafetyState } from '@/lib/agent/safety'
import { executeSkill } from '@/lib/skills/runner'
import { allSkills } from '@/lib/skills/registry'
import type { AgentContext } from '@/lib/skills/types'
import { getAgent, getConversationHistory, addMessage } from '@/lib/supabase/queries'
// TODO(security): Wire updateAgentUsage and logActivity in Phase 10 for usage metering and audit logs

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExecutionTrigger {
  agentId: string
  userId: string
  message: string
  channel: 'whatsapp' | 'email' | 'sms' | 'phone'
  conversationId: string
  senderName?: string
  senderInfo?: string
  metadata?: Record<string, unknown>
}

export interface ExecutionLog {
  timestamp: string
  type: 'info' | 'tool_call' | 'tool_result' | 'llm_response' | 'safety' | 'error' | 'output'
  message: string
  data?: Record<string, unknown>
}

export interface ExecutionResult {
  success: boolean
  response: string
  toolCallsCount: number
  iterationCount: number
  totalCostINR: number
  provider: string
  model: string
  logs: ExecutionLog[]
  durationMs: number
  needsEscalation: boolean
  error?: string
}

// ─── Agent Config Loader ────────

async function loadAgentConfig(agentId: string, userId: string): Promise<AgentConfig> {
  try {
    const agent = await getAgent(userId, agentId)
    if (!agent) throw new Error('Agent not found')

    return {
      id: agent.id,
      userId: agent.user_id,
      name: agent.name || 'AI Assistant',
      businessName: agent.business_name || 'Business',
      industry: agent.business_industry || 'General',
      products: [],
      knowledgeBase: agent.system_prompt || '',
      tone: agent.tone || 'professional',
      activeHours: { start: 9, end: 21 },
      channels: (agent.channels_whatsapp ? ['whatsapp'] : [])
        .concat(agent.channels_email ? ['email'] : [])
        .concat(agent.channels_sms ? ['sms'] : [])
        .concat(agent.channels_phone ? ['phone'] : []),
      modelTier: agent.ai_model_tier || 'free',
    }
  } catch (error) {
    // Fallback config due to DB error
    return {
      id: agentId,
      userId,
      name: 'AI Assistant',
      businessName: 'Business',
      industry: 'General',
      products: [],
      knowledgeBase: '',
      tone: 'professional',
      activeHours: { start: 9, end: 21 },
      channels: ['whatsapp', 'email'],
      modelTier: 'free',
    }
  }
}

// ─── RAG Context Loader (stub — replace with pgvector in production) ─────────

async function loadRAGContext(_agentId: string, _query: string): Promise<string> {
  // TODO(security): Query pgvector for relevant business knowledge chunks
  // SELECT content, embedding <-> $queryEmbedding AS distance
  // FROM knowledge_chunks WHERE agent_id = $agentId
  // ORDER BY distance LIMIT 5
  return ''
}

// ─── Conversation History Loader ──────────────────────────

async function loadConversationHistory(
  conversationId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  try {
    const messages = await getConversationHistory(conversationId, limit)
    return messages.map((msg) => ({
      role: msg.role === 'agent' ? 'assistant' : 'user',
      content: msg.content,
      timestamp: msg.created_at || new Date().toISOString(),
    }))
  } catch (error) {
    // No history available
    return []
  }
}

// ─── Save Message ─────────────────────────────────────────────────────

async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  agentId?: string,
  toolName?: string,
  toolResult?: string
): Promise<void> {
  try {
    await addMessage({
      conversation_id: conversationId,
      role: role === 'assistant' ? 'agent' : 'user',
      content,
      agent_id: agentId,
      tool_name: toolName,
      tool_result: toolResult,
    })
  } catch (error) {
    // Message save failed (non-blocking)

  }
}

// ─── Send via Channel ────────────────────────────────────────────────────

async function sendViaChannel(
  channel: string,
  _agentId: string,
  _to: string,
  message: string
): Promise<void> {
  // Routes to actual channel implementations:
  // - evolution.sendText() for WhatsApp
  // - resend.sendEmail() for Email
  // - exotel.sendSMS() for SMS
  // - exotel.makeCall() for Phone
  // For now, log the message
  console.log(`[${channel}] Sending: ${message.slice(0, 100)}...`)
}

// ─── Build Tool Definitions from Skill Registry ─────────────────────────────

function buildToolDefs(): ToolDefinition[] {
  return allSkills.map((skill) => ({
    type: 'function' as const,
    function: {
      name: skill.id,
      description: skill.description,
      // Minimal JSON schema representation
      parameters: { type: 'object', properties: {} },
    },
  }))
}

function buildSkillSummaries(): SkillSummary[] {
  return allSkills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
  }))
}

// ─── Escalation Detection ────────────────────────────────────────────────────

function needsEscalation(response: string): boolean {
  const escalationPatterns = [
    /speak\s+(?:to|with)\s+(?:human|person|agent|manager|representative)/i,
    /transfer\s+(?:to|me)/i,
    /complaint/i,
    /escalat/i,
    /legal\s+action/i,
    /sue\s+you/i,
    /refund/i,
    /cancel\s+(?:account|subscription|order)/i,
  ]

  return escalationPatterns.some((p) => p.test(response))
}

// ─── Core Execution Loop ────────────────────────────────────────────────────

export async function executeAgent(trigger: ExecutionTrigger): Promise<ExecutionResult> {
  const startTime = Date.now()
  const logs: ExecutionLog[] = []
  let iterationCount = 0
  let toolCallsCount = 0
  let totalCostINR = 0
  let lastProvider = ''
  let lastModel = ''
  let escalation = false

  const log = (
    type: ExecutionLog['type'],
    message: string,
    data?: Record<string, unknown>
  ): void => {
    logs.push({ timestamp: new Date().toISOString(), type, message, data })
  }

  try {
    // ─── Node 1: Load Context ──────────────────────────────────────────
    log('info', `Starting execution for agent ${trigger.agentId}`)

    const agentConfig = await loadAgentConfig(trigger.agentId, trigger.userId)
    log('info', `Loaded agent config: ${agentConfig.name}`)

    const ragContext = await loadRAGContext(trigger.agentId, trigger.message)
    if (ragContext) {
      log('info', `Loaded RAG context (${ragContext.length} chars)`)
    }

    const conversationHistory = await loadConversationHistory(trigger.conversationId)
    log('info', `Loaded ${conversationHistory.length} conversation history messages`)

    // Save the incoming user message (when Supabase is configured)
    await saveMessage(trigger.conversationId, 'user', trigger.message, trigger.agentId)

    // ─── Build System Prompt ───────────────────────────────────────────
    const systemPrompt = buildSystemPrompt({
      agentConfig,
      ragContext: ragContext || undefined,
      conversationHistory,
      currentChannel: trigger.channel,
      customerName: trigger.senderName,
      customerInfo: trigger.senderInfo,
      currentTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      availableSkills: buildSkillSummaries(),
    })

    const toolDefs = buildToolDefs()

    // ─── Build Message Array ───────────────────────────────────────────
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...formatConversationHistory(conversationHistory).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: trigger.message },
    ]

    // ─── Safety Config ─────────────────────────────────────────────────
    const safetyConfig: SafetyConfig = {
      ...DEFAULT_SAFETY_CONFIG,
      activeHoursStart: agentConfig.activeHours.start,
      activeHoursEnd: agentConfig.activeHours.end,
    }

    // ─── Node 2-3: LLM Decision Loop ──────────────────────────────────
    while (iterationCount < safetyConfig.maxIterations) {
      // ─── Node 5: Safety Check (every iteration) ─────────────────────
      const safetyState: SafetyState = {
        agentId: trigger.agentId,
        userId: trigger.userId,
        iterationCount,
        runCostINR: totalCostINR,
        actionsThisHour: 0, // Tracked internally by safety module
        actionsToday: 0,
        dailyCostINR: 0,
      }

      const safetyResult = runSafetyChecks(safetyState, safetyConfig)

      if (!safetyResult.allowed) {
        log('safety', `Safety check blocked: ${safetyResult.reason}`)
        return {
          success: false,
          response:
            'I apologize, but I am unable to continue processing at this time. A team member will follow up with you shortly.',
          toolCallsCount,
          iterationCount,
          totalCostINR,
          provider: lastProvider,
          model: lastModel,
          logs,
          durationMs: Date.now() - startTime,
          needsEscalation: true,
          error: safetyResult.reason,
        }
      }

      if (safetyResult.level === 'warn') {
        log('safety', `Safety warning: ${safetyResult.reason}`)
      }

      // ─── Node 2: LLM Decision ──────────────────────────────────────
      iterationCount++
      log('info', `Iteration ${iterationCount}: calling LLM`)

      const aiResponse = await callAI({
        messages,
        tools: toolDefs,
        temperature: 0.7,
        maxTokens: 2048,
      })

      lastProvider = aiResponse.provider
      lastModel = aiResponse.model

      const iterCost = estimateCostINR(aiResponse.provider, aiResponse.usage)
      totalCostINR += iterCost
      recordCost(trigger.agentId, iterCost)

      log(
        'info',
        `LLM response from ${aiResponse.provider}/${aiResponse.model} (cost: ₹${iterCost.toFixed(2)})`,
        {
          usage: aiResponse.usage as unknown as Record<string, unknown>,
        }
      )

      // ─── Handle Tool Calls ──────────────────────────────────────────
      if (aiResponse.tool_calls.length > 0) {
        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: aiResponse.content ?? '',
          tool_calls: aiResponse.tool_calls,
        })

        for (const toolCall of aiResponse.tool_calls) {
          toolCallsCount++
          recordAction(trigger.agentId)

          log('tool_call', `Calling tool: ${toolCall.function.name}`, {
            arguments: safeParseJSON(toolCall.function.arguments),
          })

          const skillResult = await executeToolCall(toolCall, {
            agentId: trigger.agentId,
            userId: trigger.userId,
            businessName: agentConfig.businessName,
            channel: trigger.channel,
            conversationId: trigger.conversationId,
          })

          log(
            'tool_result',
            `Tool ${toolCall.function.name}: ${skillResult.success ? 'success' : 'failed'}`,
            {
              output: skillResult.output,
              error: skillResult.error,
            }
          )

          // Feed tool result back to the conversation
          messages.push({
            role: 'tool',
            content: skillResult.success
              ? skillResult.output
              : `Error: ${skillResult.error ?? 'Unknown error'}`,
            tool_call_id: toolCall.id,
          })
        }

        // Loop back to Node 2 for next LLM decision
        continue
      }

      // ─── Node 4: Text Output ───────────────────────────────────────
      const responseText =
        aiResponse.content ?? 'I apologize, but I was unable to generate a response.'

      log('llm_response', `Final response generated (${responseText.length} chars)`)

      // Check for escalation signals
      escalation = needsEscalation(trigger.message) || needsEscalation(responseText)
      if (escalation) {
        log('info', 'Escalation detected — flagging for human review')
      }

      // Send via the appropriate channel
      await sendViaChannel(trigger.channel, trigger.agentId, '', responseText)
      log('output', `Response sent via ${trigger.channel}`)

      // Save assistant response (when Supabase is configured)
      await saveMessage(trigger.conversationId, 'assistant', responseText, trigger.agentId)

      return {
        success: true,
        response: responseText,
        toolCallsCount,
        iterationCount,
        totalCostINR,
        provider: lastProvider,
        model: lastModel,
        logs,
        durationMs: Date.now() - startTime,
        needsEscalation: escalation,
      }
    }

    // If we exhausted all iterations
    log('safety', `Max iterations (${safetyConfig.maxIterations}) reached`)
    const fallbackResponse =
      'I have been working on your request but need more time. Let me connect you with a team member who can help further.'

    await sendViaChannel(trigger.channel, trigger.agentId, '', fallbackResponse)
    await saveMessage(trigger.conversationId, 'assistant', fallbackResponse, trigger.agentId)

    return {
      success: true,
      response: fallbackResponse,
      toolCallsCount,
      iterationCount,
      totalCostINR,
      provider: lastProvider,
      model: lastModel,
      logs,
      durationMs: Date.now() - startTime,
      needsEscalation: true,
    }
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e)
    log('error', `Execution failed: ${errorMsg}`)

    return {
      success: false,
      response:
        'I apologize, but I encountered an issue processing your request. Please try again or contact support.',
      toolCallsCount,
      iterationCount,
      totalCostINR,
      provider: lastProvider,
      model: lastModel,
      logs,
      durationMs: Date.now() - startTime,
      needsEscalation: true,
      error: errorMsg,
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function executeToolCall(
  toolCall: ToolCall,
  context: AgentContext
): Promise<{ success: boolean; output: string; error?: string }> {
  try {
    const args = safeParseJSON(toolCall.function.arguments)
    const result = await executeSkill(toolCall.function.name, args, context)
    return { success: result.success, output: result.output, error: result.error }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { success: false, output: '', error: msg }
  }
}

function safeParseJSON(str: string): Record<string, unknown> {
  try {
    return JSON.parse(str) as Record<string, unknown>
  } catch {
    return { raw: str }
  }
}
