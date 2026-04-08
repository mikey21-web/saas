import { runRevenueForecast } from '@/lib/agents/20-agents/revenue-forecaster/revenue-forecaster'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface RevenueForecastContext {
  agentId: string
  userId: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for RevenueForecaster Agent
 * 90-day pipeline prediction with cashflow gap alerts
 * India-aware: festival seasons, UPI flows, Q4 push
 *
 * Trigger: "forecast revenue" / "pipeline report" / "cashflow"
 */
export async function executeRevenueForecaster(
  userMessage: string,
  ctx: RevenueForecastContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    const result = await runRevenueForecast()
    const s = result.state

    const responseMessage = buildResponse(s)
    await storeConversation(userMessage, responseMessage, ctx)

    return {
      success: true,
      message: responseMessage,
      data: {
        forecast_90day: s.forecast90Day,
        confidence_level: s.confidenceLevel,
        confidence_range: s.confidenceRange,
        cashflow_gaps: s.cashflowGaps?.length || 0,
        top_risks: s.topRisks,
        recommended_actions: s.recommendedActions,
        pipeline_count: s.activePipelineCount,
        weighted_pipeline: s.weightedForecast,
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[RevenueForecaster] Execution error:', msg)
    return { success: false, message: 'RevenueForecaster ran into an issue.', data: { error: msg } }
  }
}

function buildResponse(s: any): string {
  let msg = `📊 90-Day Forecast: ₹${s.forecast90Day?.toLocaleString('en-IN')} (${s.confidenceLevel} confidence)\n`
  msg += `Range: ₹${s.confidenceRange?.low?.toLocaleString('en-IN')} – ₹${s.confidenceRange?.high?.toLocaleString('en-IN')}\n`
  if (s.cashflowGaps?.length > 0) {
    msg += `\n⚠️ Cashflow gaps detected: ${s.cashflowGaps.map((g: any) => g.month).join(', ')}`
  }
  if (s.forecastSummary) msg += `\n\n${s.forecastSummary}`
  return msg
}

async function storeConversation(userMessage: string, agentMessage: string, ctx: RevenueForecastContext): Promise<void> {
  try {
    const identifier = ctx.fromPhone || ctx.fromEmail || 'api'
    const { data: existingConv } = await (supabaseAdmin.from('conversations') as any)
      .select('id').eq('agent_id', ctx.agentId).eq('contact_phone_or_email', identifier)
      .order('created_at', { ascending: false }).limit(1).single()
    let convId = (existingConv as any)?.id
    if (!convId) {
      const { data: newConv } = await (supabaseAdmin.from('conversations') as any)
        .insert({ agent_id: ctx.agentId, user_id: ctx.userId, contact_phone_or_email: identifier, channel: ctx.channel || 'api', status: 'active' })
        .select('id').single()
      convId = (newConv as any)?.id
    }
    if (convId) {
      await (supabaseAdmin.from('messages') as any).insert([
        { conversation_id: convId, agent_id: ctx.agentId, role: 'user', content: userMessage, channel: ctx.channel || 'api' },
        { conversation_id: convId, agent_id: ctx.agentId, role: 'agent', content: agentMessage, channel: ctx.channel || 'api' },
      ])
    }
    await (supabaseAdmin.from('agent_executions') as any).insert({
      agent_id: ctx.agentId, agent_type: 'revenue-forecaster',
      input: { message: userMessage, channel: ctx.channel },
      output: { message: agentMessage }, conversation_id: convId,
    })
  } catch (err) {
    console.error('[RevenueForecaster] Store error:', err)
  }
}
