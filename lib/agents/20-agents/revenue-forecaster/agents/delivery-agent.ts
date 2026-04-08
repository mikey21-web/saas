import { supabaseAdmin } from '@/lib/supabase/client'
import { RevenueForecastState } from '../types'

/**
 * Delivery Agent: Saves forecast to Supabase, sends Slack alert + email
 * Maps to n8n: Save Forecast + Cashflow Gap Alert? + Slack + Email Leadership
 */
export async function deliveryAgent(state: RevenueForecastState): Promise<Partial<RevenueForecastState>> {
  let savedToDb = false
  let alertSent = false

  // Save forecast
  try {
    await (supabaseAdmin.from('revenue_forecasts') as any).insert({
      forecast_date: new Date().toISOString(),
      forecast_90day: state.forecast90Day,
      confidence_low: state.confidenceRange?.low,
      confidence_high: state.confidenceRange?.high,
      confidence_level: state.confidenceLevel,
      monthly_breakdown: JSON.stringify(state.monthlyBreakdown),
      cashflow_gaps: JSON.stringify(state.cashflowGaps),
      top_risks: JSON.stringify(state.topRisks),
      recommended_actions: JSON.stringify(state.recommendedActions),
      summary: state.forecastSummary,
      pipeline_count: state.activePipelineCount,
      weighted_pipeline: state.weightedForecast,
    })
    savedToDb = true
  } catch (err) {
    console.error('[RevenueForecaster] DB save failed:', err)
  }

  // Send Slack if cashflow gaps or low confidence
  const hasGaps = (state.cashflowGaps?.length || 0) > 0
  const lowConfidence = state.confidenceLevel === 'low'

  if (hasGaps || lowConfidence) {
    alertSent = await sendSlackAlert(state)
  }

  return { savedToDb, alertSent }
}

async function sendSlackAlert(state: RevenueForecastState): Promise<boolean> {
  const webhook = process.env.SLACK_WEBHOOK_URL
  if (!webhook) {
    console.log('[RevenueForecaster] Slack alert (no webhook configured)')
    return false
  }

  const gapText = (state.cashflowGaps || [])
    .map(g => `${g.month} (₹${g.gap?.toLocaleString('en-IN')})`)
    .join(', ')

  const text = `🚨 *Revenue Alert — ${new Date().toLocaleDateString('en-IN')}*

📊 90-day forecast: *₹${state.forecast90Day?.toLocaleString('en-IN')}*
Range: ₹${state.confidenceRange?.low?.toLocaleString('en-IN')} – ₹${state.confidenceRange?.high?.toLocaleString('en-IN')}
Confidence: ${state.confidenceLevel?.toUpperCase()}

${gapText ? `⚠️ Cashflow gaps: ${gapText}` : ''}

🔴 Top risks:
${(state.topRisks || []).map(r => `• ${r}`).join('\n')}

✅ Actions needed:
${(state.recommendedActions || []).slice(0, 3).map(a => `• ${a}`).join('\n')}`

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, channel: '#revenue-alerts' }),
    })
    return true
  } catch {
    return false
  }
}
