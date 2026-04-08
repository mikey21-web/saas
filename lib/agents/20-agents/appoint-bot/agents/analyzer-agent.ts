import Anthropic from '@anthropic-ai/sdk'
import { AppointBotState } from '../types'

/**
 * Analyzer Agent: Track appointment patterns and predict no-show risk
 */
export async function analyzerAgent(state: AppointBotState): Promise<Partial<AppointBotState>> {
  try {
    const prompt = `You are appointment analytics agent. Analyze patient pattern and predict no-show risk.

Patient Profile:
- Name: ${state.patientName}
- Phone: ${state.patientPhone}
- Appointment Type: ${state.appointmentType}
- Clinic: ${state.clinicName}

Risk Factors:
1. First-time patients: Higher no-show rate (~40%)
2. Follow-ups within 2 weeks: Lower no-show (~15%)
3. Evening slots (after 5pm): Higher no-show (~35%)
4. Working-age patients (25-45): Moderate no-show (~25%)
5. Chronic patients: Lower no-show (~10%)

Analyze patient patterns and categorize:
- regular: <15% no-show history
- occasional: 15-30% no-show history
- new: First appointment
- chronic_no_show: >30% no-show history

Respond with JSON:
{
  "noShowRisk": 1-10,
  "patientCategory": "regular|occasional|new|chronic_no_show",
  "riskFactors": ["factor1", "factor2"],
  "recommendedAction": "standard_reminder|aggressive_reminder|confirm_24h_before|post_no_show_analysis"
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
          noShowRisk: result.noShowRisk || 5,
          patientCategory: result.patientCategory || 'new',
          appointmentStatus: state.bookingConfirmed ? 'scheduled' : 'scheduled',
          analytics: {
            risk_factors: result.riskFactors || [],
            recommended_action: result.recommendedAction || 'standard_reminder',
          },
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
      noShowRisk: result.noShowRisk || 5,
      patientCategory: result.patientCategory || 'new',
      appointmentStatus: state.bookingConfirmed ? 'scheduled' : 'scheduled',
      analytics: {
        risk_factors: result.riskFactors || [],
        recommended_action: result.recommendedAction || 'standard_reminder',
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Analyzer failed: ${msg}` }
  }
}
