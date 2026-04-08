import Anthropic from '@anthropic-ai/sdk'
import { PaymentReminderState } from '../types'

/**
 * Classifier Agent: Analyze invoice status, urgency, and risk
 */
export async function classifierAgent(state: PaymentReminderState): Promise<Partial<PaymentReminderState>> {
  try {
    const prompt = `You are a payment classification agent for Indian SMBs. Analyze the invoice and classify urgency.

Invoice Details:
- Amount: ₹${state.invoiceAmount}
- Days Overdue: ${state.daysOverdue}
- Customer Phone: ${state.customerPhone}
- Payment Method: ${state.paymentMethod}
- Business: ${state.businessName}
- Context: ${state.invoiceContext || 'Standard invoice'}

Classification Criteria:
- on_track: Due in future or paid on time historically
- due_soon: Due within 7 days
- overdue: 1-30 days overdue
- severely_overdue: >30 days overdue

Risk Factors:
- Multiple reminders ignored? (default: assume no)
- Large amount (>₹1,00,000)? (factor 2x risk)
- High-value customer but late payments? (seasonal businesses)
- Small business cash flow constraints

Respond with JSON:
{
  "status": "on_track|due_soon|overdue|severely_overdue",
  "urgencyLevel": "low|medium|high|critical",
  "riskScore": 1-10,
  "reasoning": "Why this classification"
}`

    try {
      // Try Groq first (faster)
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
          status: result.status || 'due_soon',
          urgencyLevel: result.urgencyLevel || 'medium',
          riskScore: result.riskScore || 5,
        }
      }
    } catch {
      // Fallback
    }

    // Fallback to Claude
    const client = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = JSON.parse(res.content[0].type === 'text' ? res.content[0].text : '{}')
    return {
      status: result.status || 'due_soon',
      urgencyLevel: result.urgencyLevel || 'medium',
      riskScore: result.riskScore || 5,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Classifier failed: ${msg}` }
  }
}
