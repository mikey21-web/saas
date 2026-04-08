import Anthropic from '@anthropic-ai/sdk'
import { SalesIntelligenceState } from '../types'

/**
 * Forecast Analyzer: 90-day pipeline prediction + cashflow alerts
 */
export async function forecastAnalyzerAgent(
  state: SalesIntelligenceState
): Promise<Partial<SalesIntelligenceState>> {
  try {
    const prompt = `You are a revenue forecaster for Indian SMBs. Analyze pipeline and forecast 90-day revenue.

Context: ${state.messageContext || 'Standard forecast request'}

Respond with JSON:
{
  "forecast_90day": 50000,
  "confidence_level": "high|medium|low",
  "confidence_range": { "low": 40000, "high": 60000 },
  "cashflow_gaps": [
    { "month": "April", "gap": 15000 }
  ],
  "top_risks": ["slow_closes", "seasonal_dip"],
  "recommended_actions": ["accelerate_deals", "reduce_expenses"]
}`

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      })

      if (groqRes.ok) {
        const data = await groqRes.json()
        const forecast = JSON.parse(data.choices?.[0]?.message?.content || '{}')
        return {
          forecast90Day: forecast.forecast_90day || 0,
          confidenceLevel: forecast.confidence_level || 'medium',
          confidenceRange: forecast.confidence_range || { low: 0, high: 0 },
          cashflowGaps: forecast.cashflow_gaps || [],
          topRisks: forecast.top_risks || [],
          recommendedActions: forecast.recommended_actions || [],
        }
      }
    } catch {
      // Fallback
    }

    const client = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const forecast = JSON.parse(res.content[0].type === 'text' ? res.content[0].text : '{}')
    return {
      forecast90Day: forecast.forecast_90day || 0,
      confidenceLevel: forecast.confidence_level || 'medium',
      confidenceRange: forecast.confidence_range || { low: 0, high: 0 },
      cashflowGaps: forecast.cashflow_gaps || [],
      topRisks: forecast.top_risks || [],
      recommendedActions: forecast.recommended_actions || [],
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Forecast analysis failed: ${msg}` }
  }
}
