import { runSalesIntelligence } from '@/lib/agents/20-agents/sales-intelligence/sales-intelligence'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface SalesIntelligenceContext {
  agentId: string
  userId: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for Sales Intelligence Agent
 * Real-time conversation analysis + 90-day revenue forecasting
 * Combines ConversationIntel + RevenueForecaster into single agent
 *
 * Trigger: Any WhatsApp/email message, "forecast revenue", "pipeline report"
 */
export async function executeSalesIntelligence(
  userMessage: string,
  ctx: SalesIntelligenceContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    const result = await runSalesIntelligence({
      userMessage,
      contactName: (ctx.metadata?.contact_name as string) || 'Customer',
      contactPhone: ctx.fromPhone,
      messageContext: (ctx.metadata?.context as string),
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
        suggested_reply: s.suggestedReply,
        hinglish_detected: s.hinglishDetected,
        forecast_90day: s.forecast90Day,
        confidence_level: s.confidenceLevel,
        confidence_range: s.confidenceRange,
        cashflow_gaps: s.cashflowGaps?.length || 0,
        top_risks: s.topRisks,
        recommended_actions: s.recommendedActions,
        alert_triggered: s.alertTriggered,
        next_action: s.nextAction,
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SalesIntelligence] Execution error:', msg)
    return { success: false, message: 'Sales Intelligence ran into an issue.', data: { error: msg } }
  }
}

function buildResponse(s: any): string {
  let msg = `📊 Sales Intelligence Report\n`
  msg += `Intent: ${s.intentScore}/10 | ${s.urgency} | ${s.stage}\n`
  msg += `Emotion: ${s.emotion}`

  if (s.churnRisk) msg += '\n⚠️ Churn risk detected'
  if (s.upsellOpportunity) msg += '\n💡 Upsell opportunity'

  msg += `\n\n💰 90-Day Forecast: ₹${s.forecast90Day?.toLocaleString('en-IN') || 0}`
  msg += `\nConfidence: ${s.confidenceLevel}`

  if (s.cashflowGaps?.length > 0) {
    msg += `\nCashflow gaps: ${s.cashflowGaps.map((g: any) => g.month).join(', ')}`
  }

  if (s.nextAction) msg += `\n\nNext action: ${s.nextAction}`

  return msg
}

async function storeConversation(
  userMessage: string,
  agentMessage: string,
  ctx: SalesIntelligenceContext
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
          channel: ctx.channel || 'whatsapp',
          status: 'active',
        })
        .select('id')
        .single()
      convId = (newConv as any)?.id
    }

    if (convId) {
      await (supabaseAdmin.from('messages') as any).insert([
        {
          conversation_id: convId,
          agent_id: ctx.agentId,
          role: 'user',
          content: userMessage,
          channel: ctx.channel || 'whatsapp',
        },
        {
          conversation_id: convId,
          agent_id: ctx.agentId,
          role: 'agent',
          content: agentMessage,
          channel: ctx.channel || 'whatsapp',
        },
      ])
    }

    await (supabaseAdmin.from('agent_executions') as any).insert({
      agent_id: ctx.agentId,
      agent_type: 'sales-intelligence',
      input: { message: userMessage, channel: ctx.channel },
      output: { message: agentMessage },
      conversation_id: convId,
    })
  } catch (err) {
    console.error('[SalesIntelligence] Store error:', err)
  }
}
