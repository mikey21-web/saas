import Anthropic from '@anthropic-ai/sdk'
import { DecisionCopilotState } from '../types'

/**
 * Prioritizer Agent: Rank the top 3 actions for today
 */
export async function prioritizerAgent(state: DecisionCopilotState): Promise<Partial<DecisionCopilotState>> {
  try {
    const prompt = `You are a business prioritization expert. Pick the 3 MOST IMPORTANT actions for today.

Challenges: ${JSON.stringify(state.topChallenges)}
Opportunities: ${JSON.stringify(state.opportunities)}
Risks: ${JSON.stringify(state.risks)}
Context: ${state.decisionContext}

Prioritization Criteria (in order):
1. Revenue impact (₹ impact in next 30 days)
2. Urgency (deadline within 48 hours)
3. Resource efficiency (can be done today, quick wins)
4. Long-term strategic value

For each action, identify:
- What to do (specific, actionable)
- Why it matters (impact in ₹ or % terms)
- How long (time estimate)
- Who (responsible person/team)
- Deadline (today/EOW/EOMonth)

Respond with JSON:
{
  "topThreeActions": [
    {
      "priority": 1,
      "action": "Specific action description",
      "impact": "₹X revenue impact or X% improvement",
      "deadline": "today|tomorrow|EOW|EOMonth",
      "owner": "Role or person"
    }
  ],
  "prioritizationMethod": "Method used to prioritize",
  "urgencyScore": 1-10
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
          temperature: 0.3,
        }),
      })

      if (groqRes.ok) {
        const data = await groqRes.json()
        const result = JSON.parse(data.choices?.[0]?.message?.content || '{}')
        return {
          topThreeActions: result.topThreeActions || [],
          prioritizationMethod: result.prioritizationMethod || 'Impact-based prioritization',
          urgencyScore: result.urgencyScore || 5,
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
      topThreeActions: result.topThreeActions || [],
      prioritizationMethod: result.prioritizationMethod || 'Impact-based prioritization',
      urgencyScore: result.urgencyScore || 5,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Prioritization failed: ${msg}` }
  }
}
