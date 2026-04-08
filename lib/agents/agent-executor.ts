/**
 * Shared Agent Executor — same pattern for all 20 agents
 * RAG + LLM + Action routing
 */

import { createClient } from '@supabase/supabase-js'
import { getAgentPrompt, AgentType, AgentPromptConfig } from './all-prompts'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ExecuteInput {
  agentId: string
  agentType: AgentType
  message: string
  channel: 'whatsapp' | 'email' | 'api' | 'widget'
  fromPhone?: string
  fromEmail?: string
  conversationId?: string
  metadata?: Record<string, unknown>
}

export interface ExecuteResult {
  success: boolean
  response: string
  parsedData?: Record<string, unknown>
  action?: string
  conversationId?: string
  error?: string
}

export async function executeAgent(input: ExecuteInput): Promise<ExecuteResult> {
  try {
    // 1. Load agent from DB
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', input.agentId)
      .single()

    if (agentError || !agent) {
      return { success: false, response: '', error: 'Agent not found' }
    }

    // 2. Get or create conversation
    let conversationId = input.conversationId
    if (!conversationId) {
      const identifier = input.fromPhone || input.fromEmail || 'anonymous'
      const { data: existingConv } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('agent_id', input.agentId)
        .eq('customer_identifier', identifier)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingConv) {
        conversationId = existingConv.id
      } else {
        const { data: newConv } = await supabaseAdmin
          .from('conversations')
          .insert({
            agent_id: input.agentId,
            user_id: agent.user_id,
            customer_identifier: identifier,
            channel: input.channel,
            status: 'active',
          })
          .select('id')
          .single()
        conversationId = newConv?.id
      }
    }

    // 3. Store incoming message
    if (conversationId) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: conversationId,
        agent_id: input.agentId,
        role: 'user',
        content: input.message,
        channel: input.channel,
      })
    }

    // 4. Load conversation history (last 10 messages)
    let history: Array<{ role: string; content: string }> = []
    if (conversationId) {
      const { data: msgs } = await supabaseAdmin
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10)
      history = (msgs || []).reverse()
    }

    // 5. Load knowledge base (RAG context)
    let ragContext = ''
    const { data: knowledgeDocs } = await supabaseAdmin
      .from('knowledge_documents')
      .select('content')
      .eq('agent_id', input.agentId)
      .limit(5)
    if (knowledgeDocs && knowledgeDocs.length > 0) {
      ragContext = knowledgeDocs.map((d: { content: string }) => d.content).join('\n\n')
    }

    // 6. Build system prompt
    const promptConfig: AgentPromptConfig = {
      businessName: agent.business_name || agent.name,
      businessKnowledge:
        ragContext || agent.business_description || 'No specific knowledge uploaded yet.',
      tone: agent.tone || 'professional',
      language: 'English (auto-detect Hinglish)',
      activeHours: `${agent.active_hours_start || 9}am-${agent.active_hours_end || 21}pm IST`,
      agentName: agent.name,
    }

    const systemPrompt = getAgentPrompt(input.agentType, promptConfig)

    // 7. Call LLM via router
    const { callAI } = await import('@/lib/ai/router')
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: input.message },
    ]

    const aiResult = await callAI({
      messages,
      temperature: 0.7,
      maxTokens: 800,
    })
    const llmResponse = aiResult.content || "I couldn't generate a response right now."

    // 8. Parse JSON response from LLM
    let parsedData: Record<string, unknown> = {}
    let responseMessage = llmResponse

    try {
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
        responseMessage = (parsedData.message as string) || llmResponse
      }
    } catch {
      // LLM returned plain text, use as-is
      responseMessage = llmResponse
    }

    // 9. Store agent response
    if (conversationId) {
      await supabaseAdmin.from('messages').insert({
        conversation_id: conversationId,
        agent_id: input.agentId,
        role: 'agent',
        content: responseMessage,
        channel: input.channel,
      })
    }

    // 10. Log execution
    await supabaseAdmin.from('agent_executions').insert({
      agent_id: input.agentId,
      agent_type: input.agentType,
      input: { message: input.message, channel: input.channel },
      output: { message: responseMessage, data: parsedData },
      conversation_id: conversationId,
    })

    return {
      success: true,
      response: responseMessage,
      parsedData,
      action: (parsedData.action as string) || (parsedData.nextAction as string),
      conversationId,
    }
  } catch (error) {
    console.error('Agent execution error:', error)
    return {
      success: false,
      response: "I'm having a moment. Please try again shortly.",
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
