import Anthropic from '@anthropic-ai/sdk'
import { DecisionCopilotState } from '../types'

/**
 * Analyzer Agent: Analyze business metrics and identify challenges/opportunities
 */
export async function analyzerAgent(state: DecisionCopilotState): Promise<Partial<DecisionCopilotState>> {
  try {
    const prompt = `You are a business analyst for ${state.businessName}.

Business Metrics:
${JSON.stringify(state.businessMetrics, null, 2)}

Recent Events:
${state.recentEvents}

User Role: ${state.userRole}

Analyze the business situation and identify:
1. Top 3 challenges (what's hurting the business)
2. Top 3 opportunities (what could accelerate growth)
3. Top 3 risks (what could go wrong)
4. Key data insights (metrics that matter most)

Focus on:
- Revenue impact (₹ terms)
- Customer impact (churn, acquisition, retention)
- Operational efficiency (time, cost, quality)
- Market dynamics (competition, trends, seasonality)

Respond with JSON:
{
  "topChallenges": ["Challenge 1", "Challenge 2", "Challenge 3"],
  "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "dataInsights": {
    "metric_1": "insight about metric",
    "metric_2": "insight about metric"
  }
}`

    try {
      // Try Groq
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
        }),
      })

      if (groqRes.ok) {
        const data = await groqRes.json()
        const result = JSON.parse(data.choices?.[0]?.message?.content || '{}')
        return {
          topChallenges: result.topChallenges || [],
          opportunities: result.opportunities || [],
          risks: result.risks || [],
          dataInsights: result.dataInsights || {},
        }
      }
    } catch {
      // Fallback
    }

    // Fallback to Claude
    const client = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = JSON.parse(res.content[0].type === 'text' ? res.content[0].text : '{}')
    return {
      topChallenges: result.topChallenges || [],
      opportunities: result.opportunities || [],
      risks: result.risks || [],
      dataInsights: result.dataInsights || {},
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Analysis failed: ${msg}` }
  }
}
