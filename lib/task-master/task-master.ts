/**
 * Task Master v2 - Main LangGraph State Machine
 * Orchestrates the 5-agent workflow: Parser → Validator → Router → Notifier → Tracker
 */

import { Annotation, StateGraph, END, START } from '@langchain/langgraph'
import {
  WorkflowState,
  AgentName,
  Task,
  CostTracking,
  WorkflowError,
  InputType,
  DirectorySource,
  DEFAULT_CONFIG,
  TaskMasterConfig,
  FailedNotification,
  TaskStatus,
} from './types'
import { parserAgent } from './agents/parser-agent'
import { validatorAgent } from './agents/validator-agent'
import { routerAgent } from './agents/router-agent'
import { notifierAgent } from './agents/notifier-agent'
import { trackerAgent } from './agents/tracker-agent'
import { logAgentTransition, logError, logCost } from './utils'

// ============================================================================
// State Definition using Annotation
// ============================================================================

const initialCostTracking: CostTracking = {
  openai_tokens: 0,
  openai_cost_usd: 0,
  whatsapp_messages: 0,
  whatsapp_cost_usd: 0,
  total_cost_usd: 0,
}

// Define state annotation for LangGraph
const TaskMasterState = Annotation.Root({
  agent_id: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => '' }),
  user_id: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => '' }),
  meeting_id: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => '' }),
  input_text: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => '' }),
  input_type: Annotation<InputType>({ reducer: (a, b) => b ?? a, default: () => 'text' }),
  directory_source: Annotation<DirectorySource>({ reducer: (a, b) => b ?? a, default: () => 'supabase' }),
  tasks: Annotation<Task[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  unrouted_tasks: Annotation<Task[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  blocked_tasks: Annotation<Task[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  failed_notifications: Annotation<FailedNotification[]>({ reducer: (a, b) => b ?? a, default: () => [] }),
  completion_status: Annotation<Record<string, TaskStatus>>({ reducer: (a, b) => ({ ...a, ...(b ?? {}) }), default: () => ({}) }),
  summary_report: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => '' }),
  current_agent: Annotation<AgentName>({ reducer: (a, b) => b ?? a, default: () => 'parser' }),
  errors: Annotation<WorkflowError[]>({ reducer: (a, b) => [...a, ...(b ?? [])], default: () => [] }),
  cost_tracking: Annotation<CostTracking>({ reducer: (a, b) => b ?? a, default: () => initialCostTracking }),
  started_at: Annotation<string>({ reducer: (a, b) => b ?? a, default: () => new Date().toISOString() }),
  completed_at: Annotation<string | undefined>({ reducer: (a, b) => b ?? a, default: () => undefined }),
})

type TaskMasterStateType = typeof TaskMasterState.State

function createInitialState(input: TaskMasterInput): TaskMasterStateType {
  return {
    // Identifiers
    agent_id: input.agent_id,
    user_id: input.user_id,
    meeting_id: input.meeting_id,

    // Input
    input_text: input.input_text,
    input_type: input.input_type || 'text',
    directory_source: input.directory_source || 'supabase',

    // Tasks
    tasks: [],
    unrouted_tasks: [],
    blocked_tasks: [],

    // Notifications
    failed_notifications: [],

    // Tracking
    completion_status: {},
    summary_report: '',

    // Metadata
    current_agent: 'parser',
    errors: [],
    cost_tracking: initialCostTracking,
    started_at: new Date().toISOString(),
    completed_at: undefined,
  }
}

// ============================================================================
// Conditional Edge Router
// ============================================================================

function routeAfterParser(state: TaskMasterStateType): string {
  // Check for fatal errors
  const fatalError = state.errors.find(e => !e.recoverable && e.agent === 'parser')
  if (fatalError) {
    logAgentTransition('parser', 'END', { reason: 'fatal_error', error: fatalError.message })
    return END
  }

  // Check if we have tasks to process
  if (state.tasks.length === 0) {
    logAgentTransition('parser', 'END', { reason: 'no_tasks_extracted' })
    return END
  }

  return 'validator'
}

function routeAfterValidator(state: TaskMasterStateType): string {
  // Check if all tasks were duplicates
  if (state.tasks.length === 0) {
    logAgentTransition('validator', 'END', { reason: 'all_duplicates' })
    return END
  }

  return 'router'
}

function routeAfterRouter(state: TaskMasterStateType): string {
  // Check if all tasks were unrouted
  if (state.tasks.length === 0 && state.unrouted_tasks.length > 0) {
    logAgentTransition('router', 'tracker', { reason: 'all_unrouted' })
    // Still go to tracker to generate summary
    return 'tracker'
  }

  return 'notifier'
}

function routeAfterNotifier(_state: TaskMasterStateType): string {
  return 'tracker'
}

function routeAfterTracker(_state: TaskMasterStateType): string {
  return END
}

// ============================================================================
// Graph Construction
// ============================================================================

type NodeName = 'parser' | 'validator' | 'router' | 'notifier' | 'tracker'

function buildTaskMasterGraph() {
  // Create the state graph with annotation
  const workflow = new StateGraph(TaskMasterState)

  // Add nodes - wrap agents to handle type conversion
  workflow.addNode('parser', async (state) => parserAgent(state as unknown as WorkflowState))
  workflow.addNode('validator', async (state) => validatorAgent(state as unknown as WorkflowState))
  workflow.addNode('router', async (state) => routerAgent(state as unknown as WorkflowState))
  workflow.addNode('notifier', async (state) => notifierAgent(state as unknown as WorkflowState))
  workflow.addNode('tracker', async (state) => trackerAgent(state as unknown as WorkflowState))

  // Add entry point - cast to any to handle LangGraph strict typing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(workflow as any).addEdge(START, 'parser')

  // Add conditional edges - use type assertion for node names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(workflow as any).addConditionalEdges('parser', routeAfterParser)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(workflow as any).addConditionalEdges('validator', routeAfterValidator)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(workflow as any).addConditionalEdges('router', routeAfterRouter)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(workflow as any).addConditionalEdges('notifier', routeAfterNotifier)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(workflow as any).addConditionalEdges('tracker', routeAfterTracker)

  return workflow
}

// ============================================================================
// Compiled Workflow
// ============================================================================

let compiledWorkflow: ReturnType<ReturnType<typeof buildTaskMasterGraph>['compile']> | null = null

export function getTaskMasterWorkflow() {
  if (!compiledWorkflow) {
    const graph = buildTaskMasterGraph()
    compiledWorkflow = graph.compile()
  }
  return compiledWorkflow
}

// ============================================================================
// Public API
// ============================================================================

export interface TaskMasterInput {
  agent_id: string
  user_id: string
  meeting_id: string
  input_text: string
  input_type?: InputType
  directory_source?: DirectorySource
}

export interface TaskMasterOutput {
  tasks: Task[]
  unrouted_tasks: Task[]
  failed_notifications: Array<{ task_id: string; reason: string; retry_count: number }>
  summary_report: string
  completion_status: Record<string, string>
  cost_tracking: CostTracking
  errors: WorkflowError[]
  duration_ms: number
}

export async function runTaskMasterWorkflow(
  input: TaskMasterInput,
  config?: Partial<TaskMasterConfig>
): Promise<TaskMasterOutput> {
  const startTime = Date.now()
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  console.log('[TaskMaster] Starting workflow', {
    agent_id: input.agent_id,
    meeting_id: input.meeting_id,
    input_type: input.input_type,
  })

  try {
    // Check rate limits and cost limits
    validateConfig(mergedConfig)

    // Create initial state
    const initialState = createInitialState(input)

    // Get and run workflow
    const workflow = getTaskMasterWorkflow()
    const result = await workflow.invoke(initialState, {
      recursionLimit: mergedConfig.max_agent_iterations,
    })

    const duration = Date.now() - startTime
    const costTracking = result.cost_tracking as CostTracking

    // Log final summary
    logCost('Total workflow cost', costTracking.total_cost_usd, {
      openai_tokens: costTracking.openai_tokens,
      whatsapp_messages: costTracking.whatsapp_messages,
      duration_ms: duration,
    })

    console.log('[TaskMaster] Workflow completed', {
      tasks_processed: (result.tasks as Task[]).length,
      unrouted: (result.unrouted_tasks as Task[]).length,
      errors: (result.errors as WorkflowError[]).length,
      duration_ms: duration,
    })

    return {
      tasks: result.tasks as Task[],
      unrouted_tasks: result.unrouted_tasks as Task[],
      failed_notifications: (result.failed_notifications as FailedNotification[]).map(n => ({
        task_id: n.task_id,
        reason: n.reason,
        retry_count: n.retry_count,
      })),
      summary_report: result.summary_report as string,
      completion_status: result.completion_status as Record<string, string>,
      cost_tracking: costTracking,
      errors: result.errors as WorkflowError[],
      duration_ms: duration,
    }
  } catch (error) {
    logError('workflow', error as Error)
    
    return {
      tasks: [],
      unrouted_tasks: [],
      failed_notifications: [],
      summary_report: '',
      completion_status: {},
      cost_tracking: initialCostTracking,
      errors: [{
        agent: 'parser',
        error_type: 'WORKFLOW_FAILED',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
        recoverable: false,
      }],
      duration_ms: Date.now() - startTime,
    }
  }
}

// ============================================================================
// Validation
// ============================================================================

function validateConfig(config: TaskMasterConfig): void {
  if (config.max_agent_iterations < 1) {
    throw new Error('max_agent_iterations must be at least 1')
  }

  if (config.max_tasks_per_minute < 1) {
    throw new Error('max_tasks_per_minute must be at least 1')
  }

  if (config.duplicate_similarity_threshold < 0 || config.duplicate_similarity_threshold > 1) {
    throw new Error('duplicate_similarity_threshold must be between 0 and 1')
  }
}

// ============================================================================
// Webhook Handler (for WhatsApp replies)
// ============================================================================

export { handleWhatsAppReply } from './agents/tracker-agent'

// ============================================================================
// Scheduled Job Handlers
// ============================================================================

export { 
  checkOverdueTasks,
  sendDueReminders,
  generateEveningSummary,
} from './agents/tracker-agent'

export {
  retryFailedNotifications,
} from './integrations'

// ============================================================================
// Utility Exports
// ============================================================================

export { retryUnroutedTask } from './agents/router-agent'
