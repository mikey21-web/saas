import Anthropic from '@anthropic-ai/sdk'
import { EmailAutomatorState } from '../types'

/**
 * Personalizer Agent: Add personalization to email sequence
 */
export async function personalizerAgent(state: EmailAutomatorState): Promise<Partial<EmailAutomatorState>> {
  try {
    if (state.emailSequence.length === 0) {
      return { personalizedEmails: [], personalizationApplied: false }
    }

    const prompt = `You are email personalization expert for ${state.businessName}.

Customer: ${state.customerName}
Email Journey: ${state.journeyType}

I have a sequence of emails. For EACH email, provide:
1. Original subject & body
2. Variable placeholders: {firstName}, {companyName}, {productName}, etc.
3. A/B variant (alternative subject for testing)

Personalization Rules:
- Use customer name naturally (not "Hi {{firstName}}")
- Include dynamic content blocks
- Create curiosity variants
- Test benefit-driven vs feature-driven

Original sequence to personalize:
${JSON.stringify(state.emailSequence, null, 2)}

Respond with JSON:
{
  "personalizedEmails": [
    {
      "index": 0,
      "subject": "Subject with {firstName}",
      "body": "Email body with {productName}",
      "personalVariants": {
        "variant_a_subject": "Alternative curious subject",
        "variant_b_subject": "Benefit-focused subject"
      }
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
          temperature: 0.4,
        }),
      })

      if (groqRes.ok) {
        const data = await groqRes.json()
        const result = JSON.parse(data.choices?.[0]?.message?.content || '{}')
        return {
          personalizedEmails: result.personalizedEmails || state.emailSequence.map((e, i) => ({
            index: i,
            subject: e.subject,
            body: e.body,
            personalVariants: {},
          })),
          personalizationApplied: true,
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
      personalizedEmails: result.personalizedEmails || state.emailSequence.map((e, i) => ({
        index: i,
        subject: e.subject,
        body: e.body,
        personalVariants: {},
      })),
      personalizationApplied: true,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Personalization failed: ${msg}` }
  }
}
