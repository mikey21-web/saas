import Anthropic from '@anthropic-ai/sdk'
import { PaymentReminderState } from '../types'

/**
 * Reminder Agent: Generate contextual payment reminders
 */
export async function reminderAgent(state: PaymentReminderState): Promise<Partial<PaymentReminderState>> {
  try {
    const toneMap = {
      low: 'friendly and casual',
      medium: 'professional and polite',
      high: 'urgent but respectful',
      critical: 'very urgent, immediate action needed',
    }

    const prompt = `You are a payment reminder expert for Indian SMBs. Generate a WhatsApp-friendly payment reminder.

Context:
- Business: ${state.businessName}
- Invoice Amount: ₹${state.invoiceAmount}
- Days Overdue: ${state.daysOverdue}
- Urgency: ${state.urgencyLevel}
- Payment Method: ${state.paymentMethod}

Tone: ${toneMap[state.urgencyLevel]}

Rules:
1. Keep WhatsApp messages under 160 chars (fits in 1 message)
2. Use friendly emojis if appropriate
3. Include payment method (UPI link format: upi://pay?pa=UPIID, Bank transfer, Cash on pickup)
4. Add a clear next action
5. For critical overdue: mention consequences (suspension, late fees per contract)

Example format:
"Hi! Invoice #123 for ₹50,000 is pending. Could you process payment by EOD today?
UPI: upi://pay?pa=business@okaxis
Bank: ICICI AC: 1234...
Thanks! 🙏"

Respond with JSON:
{
  "whatsappMessage": "Complete message for WhatsApp",
  "emailMessage": "Professional email version",
  "recommendedChannel": "whatsapp|email|both"
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
          reminderMessage: result.whatsappMessage || 'Payment reminder',
          channel: result.recommendedChannel || 'whatsapp',
          reminderSent: true,
          reminderTimestamp: new Date().toISOString(),
        }
      }
    } catch {
      // Fallback
    }

    // Fallback to Claude
    const client = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = JSON.parse(res.content[0].type === 'text' ? res.content[0].text : '{}')
    return {
      reminderMessage: result.whatsappMessage || 'Payment reminder',
      channel: result.recommendedChannel || 'whatsapp',
      reminderSent: true,
      reminderTimestamp: new Date().toISOString(),
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Reminder generation failed: ${msg}` }
  }
}
