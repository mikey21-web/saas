import Anthropic from '@anthropic-ai/sdk'
import { AppointBotState } from '../types'

/**
 * Scheduler Agent: Book appointments and manage availability
 */
export async function schedulerAgent(state: AppointBotState): Promise<Partial<AppointBotState>> {
  try {
    // Generate appointment ID
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const prompt = `You are an appointment scheduling agent for ${state.clinicName}.

Patient Request:
- Patient: ${state.patientName} (${state.patientPhone})
- Requested: ${state.appointmentDate} at ${state.appointmentTime}
- Type: ${state.appointmentType}
- Doctor: ${state.doctorName}
- Message: ${state.userMessage}

Your task:
1. Check if requested slot is available (simulate availability)
2. If available: confirm booking with WhatsApp-friendly message
3. If not available: suggest 3 alternative slots
4. Include clinic address, doctor name, preparation instructions

Booking Rules:
- Working hours: 9am-7pm IST Monday-Saturday
- Gap between appointments: 30 minutes
- Follow-up appointments: 20 minutes

Respond with JSON:
{
  "bookingConfirmed": true/false,
  "bookingMessage": "WhatsApp confirmation message",
  "appointmentId": "${appointmentId}",
  "availableSlots": ["2026-04-08 10:00", "2026-04-08 14:30"],
  "confirmationDetails": "Doctor, address, instructions"
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
          appointmentId,
          bookingConfirmed: result.bookingConfirmed || false,
          bookingMessage: result.bookingMessage || 'Appointment scheduled',
          availableSlots: result.availableSlots || [],
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
      appointmentId,
      bookingConfirmed: result.bookingConfirmed || false,
      bookingMessage: result.bookingMessage || 'Appointment scheduled',
      availableSlots: result.availableSlots || [],
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Scheduler failed: ${msg}` }
  }
}
