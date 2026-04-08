import {
  createZoomMeeting,
  saveBookedMeeting,
  sendCrmEvent,
  sendWhatsAppMessage,
} from '../integrations'
import { BookedMeetingRecord, CalendlyEventPayload, SchedulerOutput, WorkflowState } from '../types'
import { createId, mergeUniqueById } from '../utils'

export async function schedulerAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const event = state.trigger_payload?.calendly_event

  if (!event) {
    return {
      current_step: 'scheduler',
      next_step: 'completed',
      scheduler_output: { reminders: [] },
      errors: state.errors,
    }
  }

  if (event.event !== 'invitee.created') {
    return handleReminderEvent(state, event)
  }

  const zoomMeeting = await createZoomMeeting(event)
  const meeting: BookedMeetingRecord = {
    id: createId('meeting'),
    lead_id: event.lead_id,
    calendly_event_id: event.event_id,
    zoom_link: zoomMeeting.join_url,
    scheduled_at: new Date(event.scheduled_at),
    status: 'confirmed',
    whatsapp_confirmation_sent: false,
    reminders_sent_at: [],
    metadata: { invitee: event.invitee, start_url: zoomMeeting.start_url },
  }

  const confirmation = `Your meeting is confirmed for ${new Date(event.scheduled_at).toLocaleString('en-IN', { timeZone: event.invitee.timezone ?? 'Asia/Kolkata' })}. Zoom link: ${meeting.zoom_link}`
  const inviteePhone = event.invitee.phone ?? extractInviteePhone(event)
  if (inviteePhone) {
    await sendWhatsAppMessage(inviteePhone, confirmation)
    meeting.whatsapp_confirmation_sent = true
  }

  await saveBookedMeeting(meeting, state.user_id, state.agent_id)
  await sendCrmEvent({ type: 'meeting_booked', meeting })

  const reminders = buildReminderSchedule(event)
  const output: SchedulerOutput = { meeting, reminders }

  return {
    current_step: 'scheduler',
    next_step: 'analytics',
    scheduler_output: output,
    booked_meetings: mergeUniqueById(state.booked_meetings, [meeting]),
    errors: state.errors,
  }
}

function handleReminderEvent(state: WorkflowState, event: CalendlyEventPayload): Partial<WorkflowState> {
  const reminders = buildReminderSchedule(event)
  return {
    current_step: 'scheduler',
    next_step: event.event === 'no_show_followup' ? 'analytics' : 'completed',
    scheduler_output: { reminders },
    errors: state.errors,
  }
}

function buildReminderSchedule(event: CalendlyEventPayload): string[] {
  const scheduled = new Date(event.scheduled_at).getTime()
  return [24, 1].map((hours) => new Date(scheduled - hours * 60 * 60 * 1000).toISOString())
}

function extractInviteePhone(event: CalendlyEventPayload): string | undefined {
  return event.invitee.questions_and_answers
    ?.find((item) => item.question.toLowerCase().includes('phone') || item.question.toLowerCase().includes('whatsapp'))
    ?.answer
}
