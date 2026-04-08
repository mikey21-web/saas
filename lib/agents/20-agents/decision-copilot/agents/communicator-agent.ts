import Anthropic from '@anthropic-ai/sdk'
import { DecisionCopilotState } from '../types'

/**
 * Communicator Agent: Format and deliver daily brief
 */
export async function communicatorAgent(state: DecisionCopilotState): Promise<Partial<DecisionCopilotState>> {
  try {
    const actionsSummary = state.topThreeActions
      .map((a, i) => `${i + 1}. ${a.action} (${a.impact}) - By ${a.deadline}`)
      .join('\n')

    const prompt = `You are a business communications expert. Create an executive daily brief.

Business: ${state.businessName}

Top Actions:
${actionsSummary}

Top Challenges: ${state.topChallenges.join(', ')}
Key Insights: ${JSON.stringify(state.dataInsights)}

Create THREE outputs:

1. DAILY BRIEF (100-150 words, actionable summary)
   - What happened today/upcoming
   - Why it matters
   - What to do (call-to-action)

2. ACTION ITEMS (3-5 bullet points)
   - Specific, measurable
   - Owner + deadline
   - Expected outcome

3. EXECUTIVE SUMMARY (1-line hook)
   - Grab attention
   - Lead with impact
   - e.g., "₹5L revenue at risk if customer churn not addressed by EOD"

Respond with JSON:
{
  "dailyBrief": "Full brief text",
  "actionItems": ["Action 1", "Action 2", "Action 3"],
  "executiveSummary": "One-line summary"
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
          dailyBrief: result.dailyBrief || 'Daily brief pending',
          actionItems: result.actionItems || [],
          executiveSummary: result.executiveSummary || 'Business brief ready',
          deliveryChannel: 'email',
        }
      }
    } catch {
      // Fallback
    }

    // Fallback to Claude
    const client = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = JSON.parse(res.content[0].type === 'text' ? res.content[0].text : '{}')
    return {
      dailyBrief: result.dailyBrief || 'Daily brief pending',
      actionItems: result.actionItems || [],
      executiveSummary: result.executiveSummary || 'Business brief ready',
      deliveryChannel: 'email',
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Communication formatting failed: ${msg}` }
  }
}
