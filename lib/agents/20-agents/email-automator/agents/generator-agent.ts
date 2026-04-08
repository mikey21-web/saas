import Anthropic from '@anthropic-ai/sdk'
import { EmailAutomatorState } from '../types'

/**
 * Generator Agent: Create email sequences for customer journeys
 */
export async function generatorAgent(state: EmailAutomatorState): Promise<Partial<EmailAutomatorState>> {
  try {
    const sequenceLengthMap = {
      onboarding: 3,
      nurture: 5,
      winback: 4,
      upsell: 3,
      educational: 7,
    }

    const prompt = `You are an email sequence generator for ${state.businessName}.

Journey Type: ${state.journeyType}
Customer: ${state.customerName} (${state.customerEmail})
Context: ${state.journeyContext}

Create a ${sequenceLengthMap[state.journeyType]}-email sequence:

Sequence Rules:
1. Email 1: Welcome/Hook — grab attention, set expectations
2. Email 2: Value delivery — solve a problem, build trust
3. Email 3+: Deepen relationship, create urgency, call to action
4. Last email: Strong CTA or offer

Formatting:
- Subject: 50 chars max, curiosity-driven
- Body: 150-300 words, conversational tone
- Include: Value prop, social proof, CTA button

Journey Types:
- Onboarding: Getting started, product education (3 emails)
- Nurture: Relationship building, value sharing (5 emails)
- Winback: Re-engagement, special offers (4 emails)
- Upsell: Upgrade prompts, feature highlights (3 emails)
- Educational: Teach, build authority (7 emails)

Respond with JSON:
{
  "sequence": [
    {
      "subject": "Email subject",
      "body": "Email HTML body",
      "sendTime": "day_1_9am|day_3_2pm|week_1_monday_9am",
      "type": "welcome|value|social_proof|scarcity|cta"
    }
  ]
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
          temperature: 0.5,
        }),
      })

      if (groqRes.ok) {
        const data = await groqRes.json()
        const result = JSON.parse(data.choices?.[0]?.message?.content || '{}')
        return {
          emailSequence: result.sequence || [],
          sequenceLength: (result.sequence || []).length,
        }
      }
    } catch {
      // Fallback
    }

    // Fallback to Claude
    const client = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = JSON.parse(res.content[0].type === 'text' ? res.content[0].text : '{}')
    return {
      emailSequence: result.sequence || [],
      sequenceLength: (result.sequence || []).length,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Generator failed: ${msg}` }
  }
}
