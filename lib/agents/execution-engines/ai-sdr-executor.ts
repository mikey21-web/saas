import { runAiSdrWorkflow } from '@/lib/ai-sdr/ai-sdr'
import { WorkflowState } from '@/lib/ai-sdr/types'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface AiSdrContext {
  agentId: string
  userId: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for AI SDR Agent
 * 6-agent LangGraph: Lead Finder → Outreach Creator → Qualifier → Scheduler → Engagement → Analytics
 *
 * Entry points based on message intent:
 * - "find leads" / "prospect"  → lead_finder
 * - "reply received" / webhook → qualifier
 * - "meeting booked"           → scheduler
 * - "analytics" / "report"     → analytics
 * - default                    → lead_finder
 */
export async function executeAiSdr(
  userMessage: string,
  ctx: AiSdrContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    const entry_point = detectEntryPoint(userMessage)

    const result = await runAiSdrWorkflow({
      agent_id: ctx.agentId,
      user_id: ctx.userId,
      entry_point,
      trigger_payload: {
        message: userMessage,
        channel: ctx.channel || 'api',
        fromPhone: ctx.fromPhone,
        fromEmail: ctx.fromEmail,
      },
    })

    const state = result.state as WorkflowState
    const responseMessage = buildResponseMessage(state, entry_point)

    await storeConversation(userMessage, responseMessage, ctx)

    return {
      success: true,
      message: responseMessage,
      data: {
        entry_point,
        leads_found: state.leads?.length || 0,
        sequences_created: state.outreach_sequences?.length || 0,
        meetings_booked: state.booked_meetings?.length || 0,
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[AiSdr] Execution error:', msg)
    return {
      success: false,
      message: 'AI SDR ran into an issue. Please try again.',
      data: { error: msg },
    }
  }
}

function detectEntryPoint(message: string): WorkflowState['entry_point'] {
  const lower = message.toLowerCase()
  if (lower.includes('reply') || lower.includes('responded') || lower.includes('interested')) return 'qualifier'
  if (lower.includes('meeting') || lower.includes('booked') || lower.includes('calendly')) return 'scheduler'
  if (lower.includes('analytics') || lower.includes('report') || lower.includes('performance')) return 'analytics'
  if (lower.includes('engage') || lower.includes('follow up')) return 'engagement'
  return 'lead_finder'
}

function buildResponseMessage(state: WorkflowState, entry_point: string): string {
  switch (entry_point) {
    case 'lead_finder':
      return `Found ${state.leads?.length || 0} qualified leads. Created ${state.outreach_sequences?.length || 0} outreach sequences.`
    case 'qualifier':
      return `Qualified reply. ${state.booked_meetings?.length ? `Meeting booked!` : 'Follow-up sequence triggered.'}`
    case 'scheduler':
      return `Meeting processed. ${state.booked_meetings?.length || 0} meeting(s) confirmed.`
    case 'analytics':
      return state.analytics_output?.summary || 'Analytics report generated.'
    default:
      return 'AI SDR workflow completed successfully.'
  }
}

async function storeConversation(
  userMessage: string,
  agentMessage: string,
  ctx: AiSdrContext
): Promise<void> {
  try {
    const identifier = ctx.fromPhone || ctx.fromEmail || 'api'

    const { data: existingConv } = await (supabaseAdmin.from('conversations') as any)
      .select('id')
      .eq('agent_id', ctx.agentId)
      .eq('contact_phone_or_email', identifier)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let convId = (existingConv as any)?.id

    if (!convId) {
      const { data: newConv } = await (supabaseAdmin.from('conversations') as any)
        .insert({
          agent_id: ctx.agentId,
          user_id: ctx.userId,
          contact_phone_or_email: identifier,
          channel: ctx.channel || 'api',
          status: 'active',
        })
        .select('id')
        .single()
      convId = (newConv as any)?.id
    }

    if (convId) {
      await (supabaseAdmin.from('messages') as any).insert([
        { conversation_id: convId, agent_id: ctx.agentId, role: 'user', content: userMessage, channel: ctx.channel || 'api' },
        { conversation_id: convId, agent_id: ctx.agentId, role: 'agent', content: agentMessage, channel: ctx.channel || 'api' },
      ])
    }

    await (supabaseAdmin.from('agent_executions') as any).insert({
      agent_id: ctx.agentId,
      agent_type: 'ai-sdr',
      input: { message: userMessage, channel: ctx.channel },
      output: { message: agentMessage },
      conversation_id: convId,
    })
  } catch (err) {
    console.error('[AiSdr] Error storing conversation:', err)
  }
}
