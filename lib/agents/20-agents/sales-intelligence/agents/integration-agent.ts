import { supabaseAdmin } from '@/lib/supabase/client'
import { SalesIntelligenceState } from '../types'

/**
 * Integration Agent: Combine conversation + forecast insights, send alerts
 */
export async function integrationAgent(
  state: SalesIntelligenceState
): Promise<Partial<SalesIntelligenceState>> {
  let alertsSent = false

  try {
    // Build comprehensive summary
    let summary = `📊 Sales Intelligence Brief\n`
    summary += `Intent: ${state.intentScore}/10 | ${state.urgency} | ${state.stage}\n`
    summary += `Emotion: ${state.emotion}`

    if (state.churnRisk) summary += '\n⚠️ Churn risk detected'
    if (state.upsellOpportunity) summary += '\n💡 Upsell opportunity'

    summary += `\n\n💰 90-Day Forecast: ₹${state.forecast90Day?.toLocaleString('en-IN') || 0}`
    summary += `\nConfidence: ${state.confidenceLevel}`

    if (state.cashflowGaps && state.cashflowGaps.length > 0) {
      summary += `\n⚠️ Cashflow gaps: ${state.cashflowGaps.map((g: any) => g.month).join(', ')}`
    }

    // Determine if alert needed
    const shouldAlert =
      (state.intentScore || 0) >= 8 ||
      state.churnRisk ||
      (state.cashflowGaps && state.cashflowGaps.length > 0)

    // Send Slack alert if threshold met
    if (shouldAlert) {
      const webhook = process.env.SLACK_WEBHOOK_URL
      if (webhook) {
        try {
          await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🎯 Sales Alert: ${state.contactName || 'Contact'}\n${summary}`,
              channel: '#sales-intelligence',
            }),
          })
          alertsSent = true
        } catch {
          // Silent fail
        }
      }
    }

    // Store to Supabase
    try {
      await (supabaseAdmin.from('sales_intelligence_logs') as any).insert({
        contact_name: state.contactName,
        contact_phone: state.contactPhone,
        intent_score: state.intentScore,
        urgency: state.urgency,
        stage: state.stage,
        emotion: state.emotion,
        churn_risk: state.churnRisk,
        upsell_opportunity: state.upsellOpportunity,
        forecast_90day: state.forecast90Day,
        confidence_level: state.confidenceLevel,
        cashflow_gaps: JSON.stringify(state.cashflowGaps),
        top_risks: JSON.stringify(state.topRisks),
        alert_sent: shouldAlert,
        summary,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Silent fail
    }

    return {
      summary,
      alertTriggered: shouldAlert,
      alertsSent,
      nextAction: state.suggestedReply || 'Follow up based on conversation',
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Integration failed: ${msg}` }
  }
}
