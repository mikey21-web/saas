import {
  deliverSequence,
  fetchFreshQualifiedLeads,
  fetchTriggerContext,
  generateOutreachVariants,
  markLeadsContacted,
  saveOutreachSequences,
} from '../integrations'
import { LeadRecord, OutreachCreatorOutput, OutreachSequenceRecord, WorkflowState } from '../types'
import { createSequenceId, mergeUniqueById, requireEnv } from '../utils'

export async function outreachCreatorAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const env = requireEnv()
  const sourceLeads = state.lead_finder_output?.leads.length
    ? state.lead_finder_output.leads
    : await fetchFreshQualifiedLeads(state.user_id)

  const sequences: OutreachSequenceRecord[] = []
  const errors = [...state.errors]

  for (const lead of sourceLeads) {
    try {
      const trigger = await fetchTriggerContext(lead)
      const variants = await generateOutreachVariants(lead, trigger, env.calendlyBookingLink)
      sequences.push(...buildLeadSequences(lead, variants, env.calendlyBookingLink, trigger.summary))
    } catch (error) {
      errors.push(`${lead.id}: ${String(error)}`)
    }
  }

  for (const sequence of sequences) {
    const lead = sourceLeads.find((item) => item.id === sequence.lead_id)
    if (!lead) {
      continue
    }
    await deliverSequence(sequence, lead)
  }

  await saveOutreachSequences(sequences, state.user_id, state.agent_id)
  await markLeadsContacted([...new Set(sequences.map((sequence) => sequence.lead_id))])

  const updatedLeads = state.leads.map((lead) =>
    sequences.some((sequence) => sequence.lead_id === lead.id) ? { ...lead, status: 'contacted' as const } : lead,
  )

  const output: OutreachCreatorOutput = { sequences }

  return {
    current_step: 'outreach_creator',
    next_step: 'completed',
    outreach_creator_output: output,
    outreach_sequences: mergeUniqueById(state.outreach_sequences, sequences),
    leads: updatedLeads,
    errors,
  }
}

function buildLeadSequences(
  lead: LeadRecord,
  variants: Awaited<ReturnType<typeof generateOutreachVariants>>,
  ctaLink: string,
  triggerSummary: string,
): OutreachSequenceRecord[] {
  return variants.flatMap((variant) => [
    {
      id: createSequenceId(lead.id, 'linkedin', variant.variant),
      lead_id: lead.id,
      copy_variant: variant.variant,
      channel: 'linkedin',
      sent_at: new Date(),
      reply_received: false,
      subject: variant.linkedin.subject,
      message_body: variant.linkedin.body,
      icebreaker: triggerSummary,
      cta_link: ctaLink,
      trigger_summary: triggerSummary,
      status: 'sent',
      metadata: { lead_source: lead.source },
    },
    {
      id: createSequenceId(lead.id, 'whatsapp', variant.variant),
      lead_id: lead.id,
      copy_variant: variant.variant,
      channel: 'whatsapp',
      sent_at: new Date(),
      reply_received: false,
      message_body: variant.whatsapp.body,
      icebreaker: triggerSummary,
      cta_link: ctaLink,
      trigger_summary: triggerSummary,
      status: 'sent',
      metadata: { lead_source: lead.source },
    },
    {
      id: createSequenceId(lead.id, 'email', variant.variant),
      lead_id: lead.id,
      copy_variant: variant.variant,
      channel: 'email',
      sent_at: new Date(),
      reply_received: false,
      subject: variant.email.subject,
      message_body: variant.email.body,
      icebreaker: triggerSummary,
      cta_link: ctaLink,
      trigger_summary: triggerSummary,
      status: 'sent',
      metadata: { lead_source: lead.source },
    },
  ])
}
