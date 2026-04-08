import { runConversationIntel } from '@/lib/agents/20-agents/conversation-intel/conversation-intel'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface ConversationIntelContext {
  agentId: string
  userId: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for ConversationIntel Agent
 * Real-time WhatsApp intent scoring: intent 1-10, urgency, emotion, churn risk, upsell signals
 *
 * Input: WhatsApp message text
 * Output: intent score + suggested reply + next best action
 */
export async function executeConversationIntel(
  userMessage: string,
  ctx: ConversationIntelContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    const result = await runConversationIntel({
      messageId: `msg_${Date.now()}`,
      from: ctx.fromPhone || ctx.fromEmail || 'unknown',
      contactName: (ctx.metadata?.contact_name as string) || 'Customer',
      text: userMessage,
      timestamp: new Date().toISOString(),
    })

    const s = result.state
    const responseMessage = buildResponse(s)

    await storeConversation(userMessage, responseMessage, ctx)

    return {
      success: true,
      message: responseMessage,
      data: {
        intent_score: s.intentScore,
        urgency: s.urgency,
        stage: s.stage,
        emotion: s.emotion,
        churn_risk: s.churnRisk,
        upsell_opportunity: s.upsellOpportunity,
        next_best_action: s.nextBestAction,
        suggested_reply: s.suggestedReply,
        hinglish_detected: s.hinglishDetected,
        festival_context: s.festivalContext,
        alert_triggered: s.shouldAlert,
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ConvIntel] Execution error:', msg)
    return { success: false, message: 'ConversationIntel ran into an issue.', data: { error: msg } }
  }
}

function buildResponse(s: any): string {
  let msg = `Intent: ${s.intentScore}/10 | ${s.urgency} | ${s.stage} | ${s.emotion}`
  if (s.churnRisk) msg += '\n⚠️ Churn risk detected'
  if (s.upsellOpportunity) msg += '\n💡 Upsell opportunity identified'
  if (s.shouldAlert) msg += '\n🚨 Alert sent to sales team'
  if (s.nextBestAction) msg += `\nNext: ${s.nextBestAction}`
  if (s.suggestedReply) msg += `\nSuggested reply: ${s.suggestedReply}`
  return msg
}

async function storeConversation(userMessage: string, agentMessage: string, ctx: ConversationIntelContext): Promise<void> {
  try {
    const identifier = ctx.fromPhone || ctx.fromEmail || 'api'
    const { data: existingConv } = await (supabaseAdmin.from('conversations') as any)
      .select('id').eq('agent_id', ctx.agentId).eq('contact_phone_or_email', identifier)
      .order('created_at', { ascending: false }).limit(1).single()
    let convId = (existingConv as any)?.id
    if (!convId) {
      const { data: newConv } = await (supabaseAdmin.from('conversations') as any)
        .insert({ agent_id: ctx.agentId, user_id: ctx.userId, contact_phone_or_email: identifier, channel: ctx.channel || 'whatsapp', status: 'active' })
        .select('id').single()
      convId = (newConv as any)?.id
    }
    if (convId) {
      await (supabaseAdmin.from('messages') as any).insert([
        { conversation_id: convId, agent_id: ctx.agentId, role: 'user', content: userMessage, channel: ctx.channel || 'whatsapp' },
        { conversation_id: convId, agent_id: ctx.agentId, role: 'agent', content: agentMessage, channel: ctx.channel || 'whatsapp' },
      ])
    }
    await (supabaseAdmin.from('agent_executions') as any).insert({
      agent_id: ctx.agentId, agent_type: 'conversation-intel',
      input: { message: userMessage, channel: ctx.channel },
      output: { message: agentMessage }, conversation_id: convId,
    })
  } catch (err) {
    console.error('[ConvIntel] Store error:', err)
  }
}
