import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { analyticsAgent } from './agents/analytics-agent'
import { engagementAgent } from './agents/engagement-agent'
import { leadFinderAgent } from './agents/lead-finder-agent'
import { outreachCreatorAgent } from './agents/outreach-creator-agent'
import { qualifierAgent } from './agents/qualifier-agent'
import { schedulerAgent } from './agents/scheduler-agent'
import {
  BookedMeetingRecord,
  LeadFinderOutput,
  LeadRecord,
  OutreachCreatorOutput,
  OutreachSequenceRecord,
  RunAISdrInput,
  RunAISdrOutput,
  WorkflowState,
  WorkflowStep,
} from './types'
import { mergeUniqueById, mergeUniqueLeads, withRetry } from './utils'

const AISdrState = Annotation.Root({
  agent_id: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => '' }),
  user_id: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => '' }),
  entry_point: Annotation<WorkflowState['entry_point']>({ reducer: (a, b) => b ?? a, default: () => 'lead_finder' }),
  lead_finder_output: Annotation<LeadFinderOutput | undefined>({ reducer: (a, b) => b ?? a, default: () => undefined }),
  outreach_creator_output: Annotation<OutreachCreatorOutput | undefined>({ reducer: (a, b) => b ?? a, default: () => undefined }),
  qualifier_output: Annotation<WorkflowState['qualifier_output']>({ reducer: (a, b) => b ?? a, default: () => undefined }),
  scheduler_output: Annotation<WorkflowState['scheduler_output']>({ reducer: (a, b) => b ?? a, default: () => undefined }),
  engagement_output: Annotation<WorkflowState['engagement_output']>({ reducer: (a, b) => b ?? a, default: () => undefined }),
  analytics_output: Annotation<WorkflowState['analytics_output']>({ reducer: (a, b) => b ?? a, default: () => undefined }),
  leads: Annotation<LeadRecord[]>({ reducer: (a, b) => mergeUniqueLeads(a, b ?? []), default: () => [] }),
  outreach_sequences: Annotation<OutreachSequenceRecord[]>({ reducer: (a, b) => mergeUniqueById(a, b ?? []), default: () => [] }),
  booked_meetings: Annotation<BookedMeetingRecord[]>({ reducer: (a, b) => mergeUniqueById(a, b ?? []), default: () => [] }),
  current_step: Annotation<WorkflowStep>({ reducer: (a, b) => b ?? a, default: () => 'lead_finder' }),
  next_step: Annotation<WorkflowStep | undefined>({ reducer: (a, b) => b ?? a, default: () => undefined }),
  errors: Annotation<string[]>({ reducer: (a, b) => [...a, ...(b ?? [])], default: () => [] }),
  completed_at: Annotation<Date | undefined>({ reducer: (a, b) => b ?? a, default: () => undefined }),
  source_counts: Annotation<WorkflowState['source_counts']>({ reducer: (a, b) => ({ ...a, ...(b ?? {}) }), default: () => ({}) }),
  trigger_payload: Annotation<WorkflowState['trigger_payload']>({ reducer: (a, b) => b ?? a, default: () => undefined }),
  retry_count: Annotation<number>({ reducer: (a, b) => b ?? a, default: () => 0 }),
})

type AISdrGraphState = typeof AISdrState.State

function createInitialState(input: RunAISdrInput): AISdrGraphState {
  return {
    agent_id: input.agent_id,
    user_id: input.user_id,
    entry_point: input.entry_point,
    lead_finder_output: undefined,
    outreach_creator_output: undefined,
    qualifier_output: undefined,
    scheduler_output: undefined,
    engagement_output: undefined,
    analytics_output: undefined,
    leads: [],
    outreach_sequences: [],
    booked_meetings: [],
    current_step: input.entry_point,
    next_step: undefined,
    errors: [],
    completed_at: undefined,
    source_counts: {},
    trigger_payload: input.trigger_payload,
    retry_count: 0,
  }
}

async function runNodeWithRetry<T extends Partial<WorkflowState>>(
  label: string,
  operation: () => Promise<T>,
): Promise<T> {
  return withRetry(operation, {
    attempts: 3,
    backoffMs: 300_000,
    label,
  })
}

function buildAiSdrGraph() {
  const graph = new StateGraph(AISdrState)

  graph.addNode('lead_finder', async (state) => runNodeWithRetry('lead_finder', () => leadFinderAgent(state as WorkflowState)))
  graph.addNode('outreach_creator', async (state) => runNodeWithRetry('outreach_creator', () => outreachCreatorAgent(state as WorkflowState)))
  graph.addNode('qualifier', async (state) => runNodeWithRetry('qualifier', () => qualifierAgent(state as WorkflowState)))
  graph.addNode('scheduler', async (state) => runNodeWithRetry('scheduler', () => schedulerAgent(state as WorkflowState)))
  graph.addNode('engagement', async (state) => runNodeWithRetry('engagement', () => engagementAgent(state as WorkflowState)))
  graph.addNode('analytics', async (state) => runNodeWithRetry('analytics', () => analyticsAgent(state as WorkflowState)))

  ;(graph as unknown as { addConditionalEdges: (node: string, router: (state: AISdrGraphState) => string) => void }).addConditionalEdges(START, routeFromStart)
  ;(graph as unknown as { addConditionalEdges: (node: string, router: (state: AISdrGraphState) => string) => void }).addConditionalEdges('lead_finder', routeAfterLeadFinder)
  ;(graph as unknown as { addConditionalEdges: (node: string, router: (state: AISdrGraphState) => string) => void }).addConditionalEdges('outreach_creator', () => END)
  ;(graph as unknown as { addConditionalEdges: (node: string, router: (state: AISdrGraphState) => string) => void }).addConditionalEdges('qualifier', routeAfterQualifier)
  ;(graph as unknown as { addConditionalEdges: (node: string, router: (state: AISdrGraphState) => string) => void }).addConditionalEdges('scheduler', routeAfterScheduler)
  ;(graph as unknown as { addConditionalEdges: (node: string, router: (state: AISdrGraphState) => string) => void }).addConditionalEdges('engagement', () => END)
  ;(graph as unknown as { addConditionalEdges: (node: string, router: (state: AISdrGraphState) => string) => void }).addConditionalEdges('analytics', () => END)

  return graph
}

function routeFromStart(state: AISdrGraphState): string {
  if (state.entry_point === 'lead_finder') {
    return 'lead_finder'
  }
  if (state.entry_point === 'qualifier') {
    return 'qualifier'
  }
  if (state.entry_point === 'scheduler') {
    return 'scheduler'
  }
  return 'analytics'
}

function routeAfterLeadFinder(state: AISdrGraphState): string {
  return (state.lead_finder_output?.leads.length ?? 0) > 0 ? 'outreach_creator' : END
}

function routeAfterQualifier(state: AISdrGraphState): string {
  if (state.qualifier_output?.classification === 'SPAM') {
    return END
  }
  if (state.qualifier_output?.classification === 'INTERESTED') {
    return 'scheduler'
  }
  return 'engagement'
}

function routeAfterScheduler(state: AISdrGraphState): string {
  return state.scheduler_output?.meeting ? 'analytics' : END
}

let compiledWorkflow: ReturnType<ReturnType<typeof buildAiSdrGraph>['compile']> | null = null

export function getAiSdrWorkflow() {
  if (!compiledWorkflow) {
    compiledWorkflow = buildAiSdrGraph().compile()
  }
  return compiledWorkflow
}

export async function runAiSdrWorkflow(input: RunAISdrInput): Promise<RunAISdrOutput> {
  const startedAt = Date.now()
  const workflow = getAiSdrWorkflow()
  const result = await workflow.invoke(createInitialState(input), { recursionLimit: 12 })
  return {
    state: result as WorkflowState,
    duration_ms: Date.now() - startedAt,
  }
}
