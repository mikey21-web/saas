import { callAI } from '@/lib/ai/router'
import { AiCmoState, MarketingStrategy } from '../types'

/**
 * Strategy Builder Agent
 * Takes the brand profile and builds a concrete marketing strategy:
 * channels, content calendar, quick wins, monthly goals
 */
export async function strategyAgent(state: AiCmoState): Promise<Partial<AiCmoState>> {
  if (!state.brandProfile) {
    return { marketingStrategy: null }
  }

  const b = state.brandProfile

  const prompt = `You are an expert CMO. Based on this brand profile, build a practical marketing strategy.

BRAND PROFILE:
- Brand: ${b.brandName}
- Industry: ${b.industry}
- Tone: ${b.tone.join(', ')}
- Target Audience: ${b.targetAudience}
- Unique Value Prop: ${b.uniqueValueProp}
- Content Pillars: ${b.contentPillars.join(', ')}
- Key Messages: ${b.keyMessages.join(', ')}
- Writing Style: ${b.writingStyle}

USER REQUEST: ${state.userRequest}

Return a JSON object:
{
  "summary": "2-sentence marketing strategy summary",
  "primaryChannel": "The single best channel for this brand right now (LinkedIn/Twitter/Instagram/Email/WhatsApp)",
  "contentCalendar": [
    { "day": "Monday", "pillar": "content pillar name", "format": "LinkedIn post / Twitter thread / Email / etc", "idea": "Specific post idea in 1 sentence" },
    { "day": "Tuesday", "pillar": "...", "format": "...", "idea": "..." },
    { "day": "Wednesday", "pillar": "...", "format": "...", "idea": "..." },
    { "day": "Thursday", "pillar": "...", "format": "...", "idea": "..." },
    { "day": "Friday", "pillar": "...", "format": "...", "idea": "..." }
  ],
  "quickWins": ["3 things they can do this week to get traction — specific and actionable"],
  "monthlyGoals": ["3 measurable goals for this month"]
}

Return ONLY the JSON.`

  try {
    const response = await callAI({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      maxTokens: 1000,
    })

    const text = response.content.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const marketingStrategy = JSON.parse(jsonMatch[0]) as MarketingStrategy

    return { marketingStrategy }
  } catch (err) {
    return {
      marketingStrategy: null,
      error: err instanceof Error ? err.message : 'Strategy generation failed',
    }
  }
}
