import {
  enrichLeadContact,
  saveQualifiedLeads,
  scoreLeadWithGroq,
  searchApolloLeads,
  searchGoogleLeads,
  searchLinkedInLeads,
  withRetry,
} from '../integrations'
import { LeadFinderOutput, LeadRecord, WorkflowState } from '../types'
import {
  buildLeadRecord,
  countSources,
  defaultLeadFilters,
  isQualifiedLead,
  mergeUniqueLeads,
} from '../utils'

export async function leadFinderAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const filters = defaultLeadFilters()
  const sourceResults = await Promise.allSettled([
    withRetry(() => searchLinkedInLeads(filters), { attempts: 3, backoffMs: 1_000, label: 'LinkedIn lead search' }),
    withRetry(() => searchApolloLeads(filters), { attempts: 3, backoffMs: 1_000, label: 'Apollo lead search' }),
    withRetry(() => searchGoogleLeads(filters), { attempts: 3, backoffMs: 1_000, label: 'Google lead search' }),
  ])

  const errors = [...state.errors]
  const candidates = sourceResults.flatMap((result) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    errors.push(String(result.reason))
    return []
  })

  const normalized = candidates.map(buildLeadRecord)
  const filtered = normalized.filter((lead) => isQualifiedLead(lead, filters))
  const enrichedLeads: LeadRecord[] = []

  for (const lead of filtered) {
    try {
      const enriched = await withRetry(() => enrichLeadContact(lead), {
        attempts: 3,
        backoffMs: 1_000,
        label: `Lead enrichment ${lead.company_name}`,
      })
      const score = await withRetry(() => scoreLeadWithGroq(enriched), {
        attempts: 3,
        backoffMs: 1_000,
        label: `Lead scoring ${lead.company_name}`,
      })
      enrichedLeads.push({
        ...enriched,
        icp_score: score.score,
        metadata: { ...enriched.metadata, icp_reasoning: score.reasoning },
      })
    } catch (error) {
      errors.push(String(error))
    }
  }

  const mergedLeads = mergeUniqueLeads(state.leads, enrichedLeads)
  const output: LeadFinderOutput = {
    leads: enrichedLeads,
    icp_scores: enrichedLeads.map((lead) => lead.icp_score),
  }

  await saveQualifiedLeads(enrichedLeads, state.user_id, state.agent_id)

  return {
    current_step: 'lead_finder',
    next_step: enrichedLeads.length > 0 ? 'outreach_creator' : 'completed',
    lead_finder_output: output,
    leads: mergedLeads,
    source_counts: countSources(enrichedLeads),
    errors,
  }
}
