import { ChatGroq } from '@langchain/groq'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatAnthropic } from '@langchain/anthropic'
import { RevenueForecastState } from '../types'

/**
 * Forecast Agent: AI-powered 90-day revenue prediction
 * India-aware: festival seasons (Diwali, March year-end), UPI flows, Q4 push
 * Groq → Gemini → Claude fallback
 * Maps to n8n: AI Revenue Forecast node
 */
export async function forecastAgent(state: RevenueForecastState): Promise<Partial<RevenueForecastState>> {
  const staleValue = state.staleDeals.reduce((s, d: any) => s + parseFloat(d.amount || 0), 0)

  const prompt = `You are a B2B revenue forecasting expert for an India-based SaaS company. Analyze pipeline data and produce a 90-day forecast. Account for Indian market patterns: festival seasons (Diwali Oct-Nov, year-end March), UPI deal flows, and typical Q4 push.

Return ONLY valid JSON (no markdown):
{
  "forecast90Day": <number in INR>,
  "confidenceRange": { "low": <number>, "high": <number> },
  "confidenceLevel": "high" | "medium" | "low",
  "monthlyBreakdown": [
    { "month": "<Month YYYY>", "predicted": <number>, "scenario": "base" },
    { "month": "<Month YYYY>", "predicted": <number>, "scenario": "base" },
    { "month": "<Month YYYY>", "predicted": <number>, "scenario": "base" }
  ],
  "cashflowGaps": [{ "month": "<Month YYYY>", "gap": <number>, "severity": "critical" | "warning" }],
  "topRisks": ["<risk1>", "<risk2>", "<risk3>"],
  "topOpportunities": ["<opp1>", "<opp2>"],
  "staleDealsAtRisk": <number in INR>,
  "recommendedActions": ["<action1>", "<action2>", "<action3>"],
  "summary": "<3 sentence executive summary>"
}

Pipeline data:
Active pipeline deals: ${state.activePipelineCount}
Total pipeline value: ₹${state.totalPipeline.toLocaleString('en-IN')}
Weighted pipeline (stage-adjusted): ₹${state.weightedForecast.toLocaleString('en-IN')}
Historical win rate: ${state.historicalWinRate}%
Avg deal value: ₹${state.avgDealValue.toLocaleString('en-IN')}
Avg sales cycle: ${state.avgSalesCycleDays} days
MoM growth trend: ${state.momGrowthRate}%
Stale deals (14+ days no activity): ${state.staleDealCount} deals
Stale deal value at risk: ₹${staleValue.toLocaleString('en-IN')}
Today: ${new Date().toISOString()}`

  let response = ''

  try {
    const groq = new ChatGroq({ apiKey: process.env.GROQ_API_KEY, model: 'mixtral-8x7b-32768', temperature: 0.2, maxTokens: 1500 })
    const result = await groq.invoke([{ role: 'user', content: prompt }])
    response = result.content as string
  } catch {
    try {
      const gemini = new ChatGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY, model: 'gemini-2.0-flash', temperature: 0.2, maxOutputTokens: 1500 })
      const result = await gemini.invoke([{ role: 'user', content: prompt }])
      response = result.content as string
    } catch {
      const claude = new ChatAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-opus-4-6', temperature: 0.2, maxTokens: 1500 })
      const result = await claude.invoke([{ role: 'user', content: prompt }])
      response = result.content as string
    }
  }

  try {
    const clean = response.replace(/```json|```/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    const f = JSON.parse(match ? match[0] : clean)
    return {
      forecast90Day: f.forecast90Day || state.weightedForecast,
      confidenceRange: f.confidenceRange || { low: state.weightedForecast * 0.8, high: state.weightedForecast * 1.2 },
      confidenceLevel: f.confidenceLevel || 'medium',
      monthlyBreakdown: f.monthlyBreakdown || [],
      cashflowGaps: f.cashflowGaps || [],
      topRisks: f.topRisks || [],
      topOpportunities: f.topOpportunities || [],
      recommendedActions: f.recommendedActions || [],
      forecastSummary: f.summary || '',
    }
  } catch (e) {
    return {
      forecast90Day: state.weightedForecast,
      confidenceRange: { low: state.weightedForecast * 0.8, high: state.weightedForecast * 1.2 },
      confidenceLevel: 'low',
      monthlyBreakdown: [], cashflowGaps: [], topRisks: [],
      topOpportunities: [], recommendedActions: [],
      forecastSummary: 'Forecast generation failed — using weighted pipeline as estimate',
      error: `Parse error: ${e instanceof Error ? e.message : 'Unknown'}`,
    }
  }
}
