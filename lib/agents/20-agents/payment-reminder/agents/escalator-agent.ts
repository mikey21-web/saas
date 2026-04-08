import Anthropic from '@anthropic-ai/sdk'
import { PaymentReminderState } from '../types'

/**
 * Escalator Agent: Decide when to escalate to human
 */
export async function escalatorAgent(state: PaymentReminderState): Promise<Partial<PaymentReminderState>> {
  try {
    const escalationPrompt = `You are an escalation decision agent. Determine if this payment case needs human intervention.

Case Details:
- Invoice: ₹${state.invoiceAmount}
- Days Overdue: ${state.daysOverdue}
- Urgency: ${state.urgencyLevel}
- Risk Score: ${state.riskScore}/10
- Status: ${state.paymentStatus}
- Business: ${state.businessName}

Escalation Triggers:
1. Critical urgency + severely overdue (>45 days) → Always escalate
2. Risk score > 7 → Likely escalate
3. Multiple unpaid invoices from same customer → Escalate
4. Large amount (>₹5,00,000) + overdue → Escalate
5. Customer not responding to 2+ reminders → Escalate
6. Legal action needed (dispute) → Escalate
7. Special payment arrangement needed → Escalate

Non-escalation Cases:
- New customer, first late payment
- One-time seasonal delay
- Known customer with good history
- Amount < ₹50,000 and <15 days overdue

Respond with JSON:
{
  "shouldEscalate": true/false,
  "escalationReason": "Why escalate",
  "recommendedAction": "Legal notice|Suspend service|Payment plan|Call customer|Write-off",
  "priority": "low|medium|high"
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
          messages: [{ role: 'user', content: escalationPrompt }],
          temperature: 0.3,
        }),
      })

      if (groqRes.ok) {
        const data = await groqRes.json()
        const result = JSON.parse(data.choices?.[0]?.message?.content || '{}')
        return {
          shouldEscalate: result.shouldEscalate || false,
          escalationReason: result.escalationReason || 'No escalation needed',
          escalationNotes: result.recommendedAction || '',
          assignedTo: result.shouldEscalate ? 'finance_team' : '',
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
      messages: [{ role: 'user', content: escalationPrompt }],
    })

    const result = JSON.parse(res.content[0].type === 'text' ? res.content[0].text : '{}')
    return {
      shouldEscalate: result.shouldEscalate || false,
      escalationReason: result.escalationReason || 'No escalation needed',
      escalationNotes: result.recommendedAction || '',
      assignedTo: result.shouldEscalate ? 'finance_team' : '',
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Escalation analysis failed: ${msg}` }
  }
}
