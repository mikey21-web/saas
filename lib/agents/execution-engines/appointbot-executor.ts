import { runAppointBot } from '@/lib/agents/20-agents/appoint-bot/appoint-bot'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface AppointBotContext {
  agentId: string
  userId?: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for AppointBot Agent
 * Books appointments, sends reminders, fills no-shows
 *
 * Trigger: "Book appointment", patient WhatsApp, scheduled reminder
 */
export async function executeAppointBot(
  userMessage: string,
  ctx: AppointBotContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    // Parse appointment details from metadata or message
    const clinicName = (ctx.metadata?.clinic_name as string) || 'Clinic'
    const patientPhone = ctx.fromPhone || (ctx.metadata?.patient_phone as string) || ''
    const patientName = (ctx.metadata?.patient_name as string) || 'Patient'
    const appointmentDate = (ctx.metadata?.appointment_date as string) || new Date().toISOString().split('T')[0]
    const appointmentTime = (ctx.metadata?.appointment_time as string) || '10:00'
    const appointmentType =
      (ctx.metadata?.appointment_type as 'consultation' | 'follow_up' | 'treatment' | 'checkup') || 'consultation'
    const doctorName = (ctx.metadata?.doctor_name as string) || 'Doctor'

    const result = await runAppointBot({
      clinicName,
      patientPhone,
      patientName,
      appointmentDate,
      appointmentTime,
      appointmentType,
      doctorName,
      userMessage,
    })

    const s = result.state
    const responseMessage = buildResponse(s)
    await storeExecution(s, ctx, userMessage)

    return {
      success: true,
      message: responseMessage,
      data: {
        appointment_id: s.appointmentId,
        booking_confirmed: s.bookingConfirmed,
        booking_message: s.bookingMessage,
        reminder_sent: s.reminderSent,
        reminder_channel: s.reminderChannel,
        available_slots: s.availableSlots,
        no_show_risk: s.noShowRisk,
        patient_category: s.patientCategory,
        appointment_status: s.appointmentStatus,
        fill_success: s.fillSuccess,
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[AppointBot] Execution error:', msg)
    return {
      success: false,
      message: 'Appointment booking failed.',
      data: { error: msg },
    }
  }
}

function buildResponse(s: any): string {
  let msg = `📅 Appointment Booking\n`

  if (s.bookingConfirmed) {
    msg += `✅ Confirmed: ${s.appointmentDate} at ${s.appointmentTime}\n`
    msg += `Doctor: ${s.doctorName}\n`
  } else {
    msg += `❌ Not available at requested time\n`
    if (s.availableSlots.length > 0) {
      msg += `Available slots:\n${s.availableSlots.slice(0, 3).join('\n')}\n`
    }
  }

  if (s.reminderSent) {
    msg += `\n📲 Reminder scheduled (${s.reminderChannel})`
  }

  if (s.noShowRisk > 6) {
    msg += `\n⚠️ High no-show risk (${s.noShowRisk}/10)`
  }

  return msg
}

async function storeExecution(state: any, ctx: AppointBotContext, userMessage: string): Promise<void> {
  try {
    await supabaseAdmin.from('agent_executions').insert({
      agent_id: ctx.agentId,
      agent_type: 'appointbot',
      input: {
        message: userMessage,
        patient: state.patientName,
        clinic: state.clinicName,
      },
      output: {
        booking_confirmed: state.bookingConfirmed,
        appointment_id: state.appointmentId,
        no_show_risk: state.noShowRisk,
      },
    })
  } catch (err) {
    console.error('[AppointBot] Store error:', err)
  }
}
