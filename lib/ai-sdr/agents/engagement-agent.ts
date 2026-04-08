import {
  analyzeEngagement,
  fetchLeadById,
  saveEngagementLog,
  sendEmailMessage,
  sendLinkedInMessage,
  sendSlackEscalation,
  sendWhatsAppMessage,
} from '../integrations'
import { EngagementOutput, WorkflowState } from '../types'

export async function engagementAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const reply = state.trigger_payload?.reply
  if (!reply) {
    throw new Error('Engagement requires trigger_payload.reply')
  }

  const lead = await fetchLeadById(reply.lead_id)
  const analysis = await analyzeEngagement(reply, lead)

  if (analysis.reply) {
    await sendReply(reply.channel, lead?.linkedin_url ?? '', lead?.phone ?? reply.sender_phone ?? '', lead?.email ?? reply.sender_email ?? '', analysis.reply)
  }

  if (analysis.escalate) {
    await sendSlackEscalation(`High-value SDR escalation for ${lead?.company_name ?? reply.lead_id}: ${reply.reply_text}`)
  }

  await saveEngagementLog({
    user_id: state.user_id,
    agent_id: state.agent_id,
    lead_id: reply.lead_id,
    sequence_id: reply.sequence_id,
    sentiment: analysis.sentiment,
    intent: analysis.intent,
    escalate: analysis.escalate,
    payload: { reply },
  })

  const output: EngagementOutput = {
    sentiment: analysis.sentiment,
    escalate: analysis.escalate,
  }

  return {
    current_step: 'engagement',
    next_step: 'completed',
    engagement_output: output,
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
  await sendEmailMessage(email, 'Re: your message', body)
}
