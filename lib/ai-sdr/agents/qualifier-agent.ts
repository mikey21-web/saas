import {
  classifyReply,
  fetchLeadById,
  fetchObjectionHandler,
  fetchSequenceById,
  sendEmailMessage,
  sendLinkedInMessage,
  sendWhatsAppMessage,
  updateOutreachReply,
} from '../integrations'
import { QualifierOutput, WorkflowState } from '../types'
import { requireEnv } from '../utils'

export async function qualifierAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const reply = state.trigger_payload?.reply
  if (!reply) {
    throw new Error('Qualifier requires trigger_payload.reply')
  }

  const env = requireEnv()
  const sequence = await fetchSequenceById(reply.sequence_id)
  const lead = await fetchLeadById(reply.lead_id)
  const analysis = await classifyReply(reply, sequence)

  if (analysis.classification === 'INTERESTED') {
    const response = analysis.auto_reply ?? `Great to hear. Here is my Calendly link for a 15-minute chat: ${env.calendlyBookingLink}`
    await sendReply(reply.channel, lead?.linkedin_url ?? '', lead?.phone ?? reply.sender_phone ?? '', lead?.email ?? reply.sender_email ?? '', response)
  }

  if (analysis.classification === 'OBJECTION') {
    const objectionReply = (await fetchObjectionHandler(analysis.objection_key)) ?? analysis.auto_reply ?? 'Thanks for the context. Sharing a quick answer that may help.'
    await sendReply(reply.channel, lead?.linkedin_url ?? '', lead?.phone ?? reply.sender_phone ?? '', lead?.email ?? reply.sender_email ?? '', objectionReply)
  }

  await updateOutreachReply({
    sequenceId: reply.sequence_id,
    replyText: reply.reply_text,
    sentiment: analysis.sentiment,
    intent: analysis.intent,
  })

  const output: QualifierOutput = {
    classification: analysis.classification,
    next_action:
      analysis.classification === 'INTERESTED'
        ? 'await_calendly_booking'
        : analysis.classification === 'OBJECTION'
          ? 'objection_handled'
          : analysis.classification === 'SPAM'
            ? 'ignore'
            : 'disqualify',
  }

  return {
    current_step: 'qualifier',
    next_step: analysis.classification === 'INTERESTED' ? 'scheduler' : 'engagement',
    qualifier_output: output,
    errors: state.errors,
  }
}

async function sendReply(
  channel: 'linkedin' | 'whatsapp' | 'email',
  linkedinUrl: string,
  phone: string,
  email: string,
  body: string,
): Promise<void> {
  if (channel === 'linkedin') {
    await sendLinkedInMessage(linkedinUrl, body)
    return
  }
  if (channel === 'whatsapp') {
    await sendWhatsAppMessage(phone, body)
    return
  }
  await sendEmailMessage(email, 'Re: quick follow up', body)
}
