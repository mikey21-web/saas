import Anthropic from '@anthropic-ai/sdk'
import { AppointBotState } from '../types'

/**
 * Reminder Agent: Send appointment reminders 24h and 2h before
 */
export async function reminderAgent(state: AppointBotState): Promise<Partial<AppointBotState>> {
  try {
    if (!state.bookingConfirmed) {
      return { reminderSent: false }
    }

    const appointmentDateTime = `${state.appointmentDate} ${state.appointmentTime}`
    const prompt = `You are appointment reminder expert for ${state.clinicName}.

Appointment Details:
- Patient: ${state.patientName}
- Appointment: ${appointmentDateTime}
- Type: ${state.appointmentType}
- Doctor: ${state.doctorName}
- Phone: ${state.patientPhone}

Create TWO reminder messages:
1. 24-hour reminder: "Your appointment tomorrow..."
2. 2-hour reminder: "Your appointment in 2 hours..."

Rules:
- Keep under 160 chars (fit in 1 WhatsApp message)
- Include: Date, time, doctor name, clinic name
- Add: Cancellation link or instructions
- Use friendly tone with emoji
- Include prep instructions (fasting, documents, etc.)

Example 24h:
"Hi ${state.patientName}! Your appointment with Dr. ${state.doctorName} is tomorrow at ${state.appointmentTime}.
📍 ${state.clinicName}
Please arrive 10min early. Cancel: [link]"

Respond with JSON:
{
  "reminder24h": "Message for 24h before",
  "reminder2h": "Message for 2h before",
  "recommendedChannel": "whatsapp|sms|email"
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
          reminderSent: true,
          reminderMessage: result.reminder24h || 'Appointment reminder',
          reminderChannel: result.recommendedChannel || 'whatsapp',
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
      reminderSent: true,
      reminderMessage: result.reminder24h || 'Appointment reminder',
      reminderChannel: result.recommendedChannel || 'whatsapp',
      reminderTimestamp: new Date().toISOString(),
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Reminder generation failed: ${msg}` }
  }
}
