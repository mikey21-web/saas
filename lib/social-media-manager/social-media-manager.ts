/**
 * Social Media Manager - LangGraph Orchestrator
 * 
 * 6-Agent Multi-Agent Orchestration:
 * 1. Content Creator - Generate platform-native content
 * 2. Trend Spotter - Detect trends and alert users
 * 3. Scheduler - Auto-publish to platforms
 * 4. Analytics - Track engagement and insights
 * 5. Engagement - Auto-reply and lead detection
 * 6. Approval - Manual review workflow
 */

import { StateGraph, END, Annotation } from '@langchain/langgraph';
import {
  WorkflowState,
  ContentCreatorInput,
  TrendSpotterInput,
  SchedulerInput,
  AnalyticsInput,
  EngagementInput,
  ApprovalInput,
  DEFAULT_SMM_CONFIG,
} from './types';
import { contentCreatorAgent } from './agents/content-creator-agent';
import { trendSpotterAgent } from './agents/trend-spotter-agent';
import { schedulerAgent } from './agents/scheduler-agent';
import { analyticsAgent } from './agents/analytics-agent';
import { engagementAgent } from './agents/engagement-agent';
import { approvalAgent } from './agents/approval-agent';
import { generateId } from './utils';

// =============================================================================
// STATE ANNOTATION (LangGraph 0.2+ Pattern)
// =============================================================================

const SMMAnnotation = Annotation.Root({
  agent_id: Annotation<string>(),
  user_id: Annotation<string>(),
  user: Annotation<WorkflowState['user']>(),
  nkp: Annotation<WorkflowState['nkp']>(),
  
  // Agent inputs
  content_creator_input: Annotation<ContentCreatorInput | undefined>(),
  trend_spotter_input: Annotation<TrendSpotterInput | undefined>(),
  scheduler_input: Annotation<SchedulerInput | undefined>(),
  analytics_input: Annotation<AnalyticsInput | undefined>(),
  engagement_input: Annotation<EngagementInput | undefined>(),
  approval_input: Annotation<ApprovalInput | undefined>(),
  
  // Agent outputs
  content_creator_output: Annotation<WorkflowState['content_creator_output']>(),
  trend_spotter_output: Annotation<WorkflowState['trend_spotter_output']>(),
  scheduler_output: Annotation<WorkflowState['scheduler_output']>(),
  analytics_output: Annotation<WorkflowState['analytics_output']>(),
  engagement_output: Annotation<WorkflowState['engagement_output']>(),
  approval_output: Annotation<WorkflowState['approval_output']>(),
  
  // Shared state with reducers
  posts: Annotation<WorkflowState['posts']>({
    reducer: (prev, next) => [...(prev || []), ...(next || [])],
    default: () => [],
  }),
  trends: Annotation<WorkflowState['trends']>({
    reducer: (prev, next) => [...(prev || []), ...(next || [])],
    default: () => [],
  }),
  analytics_reports: Annotation<WorkflowState['analytics_reports']>({
    reducer: (prev, next) => [...(prev || []), ...(next || [])],
    default: () => [],
  }),
  engagement_logs: Annotation<WorkflowState['engagement_logs']>({
    reducer: (prev, next) => [...(prev || []), ...(next || [])],
    default: () => [],
  }),
  pending_approvals: Annotation<WorkflowState['pending_approvals']>({
    reducer: (_, next) => next || [], // Replace, not merge
    default: () => [],
  }),
  
  // Workflow control
  current_step: Annotation<string>(),
  entry_point: Annotation<WorkflowState['entry_point']>(),
  next_step: Annotation<string | undefined>(),
  published_count: Annotation<number>({
    reducer: (prev, next) => (prev || 0) + (next || 0),
    default: () => 0,
  }),
  failed_count: Annotation<number>({
    reducer: (prev, next) => (prev || 0) + (next || 0),
    default: () => 0,
  }),
  
  // Error handling with reducers
  errors: Annotation<string[]>({
    reducer: (prev, next) => [...(prev || []), ...(next || [])],
    default: () => [],
  }),
  warnings: Annotation<string[]>({
    reducer: (prev, next) => [...(prev || []), ...(next || [])],
    default: () => [],
  }),
  
  // Metadata
  started_at: Annotation<Date>(),
  completed_at: Annotation<Date | undefined>(),
});

type SMMState = typeof SMMAnnotation.State;

// =============================================================================
// AGENT NODE WRAPPERS
// =============================================================================

async function contentCreatorNode(state: SMMState): Promise<Partial<SMMState>> {
  const result = await contentCreatorAgent(state as unknown as WorkflowState);
  return result as Partial<SMMState>;
}

async function trendSpotterNode(state: SMMState): Promise<Partial<SMMState>> {
  const result = await trendSpotterAgent(state as unknown as WorkflowState);
  return result as Partial<SMMState>;
}

async function schedulerNode(state: SMMState): Promise<Partial<SMMState>> {
  const result = await schedulerAgent(state as unknown as WorkflowState);
  return result as Partial<SMMState>;
}

async function analyticsNode(state: SMMState): Promise<Partial<SMMState>> {
  const result = await analyticsAgent(state as unknown as WorkflowState);
  return result as Partial<SMMState>;
}

async function engagementNode(state: SMMState): Promise<Partial<SMMState>> {
  const result = await engagementAgent(state as unknown as WorkflowState);
  return result as Partial<SMMState>;
}

async function approvalNode(state: SMMState): Promise<Partial<SMMState>> {
  const result = await approvalAgent(state as unknown as WorkflowState);
  return result as Partial<SMMState>;
}

// =============================================================================
// ROUTING FUNCTIONS
// =============================================================================

/**
 * Route from entry point to first agent
 */
function routeFromEntry(state: SMMState): string {
  switch (state.entry_point) {
    case 'content_creator':
      return 'content_creator';
    case 'trend_spotter':
      return 'trend_spotter';
    case 'scheduler':
      return 'scheduler';
    case 'analytics':
      return 'analytics';
    case 'engagement':
      return 'engagement';
    case 'approval':
      return 'approval';
    default:
      return 'content_creator';
  }
}

/**
 * Route after Content Creator completes
 */
function routeAfterContentCreator(state: SMMState): string {
  // Check for errors
  if (state.current_step === 'content_creator_error') {
    return END;
  }
  
  // Route based on next_step
  if (state.next_step === 'approval') {
    return 'approval';
  }
  if (state.next_step === 'scheduler') {
    return 'scheduler';
  }
  
  return END;
}

/**
 * Route after Trend Spotter completes
 */
function routeAfterTrendSpotter(state: SMMState): string {
  if (state.current_step === 'trend_spotter_error') {
    return END;
  }
  
  // If high-relevance trends found, trigger content creator
  if (state.next_step === 'content_creator') {
    return 'content_creator';
  }
  
  return END;
}

/**
 * Route after Scheduler completes
 */
function routeAfterScheduler(state: SMMState): string {
  if (state.current_step === 'scheduler_error') {
    return END;
  }
  
  // Optionally trigger analytics after publishing
  if (state.next_step === 'analytics') {
    return 'analytics';
  }
  
  return END;
}

/**
 * Route after Analytics completes
 */
function routeAfterAnalytics(state: SMMState): string {
  // Analytics is typically a terminal node
  return END;
}

/**
 * Route after Engagement completes
 */
function routeAfterEngagement(state: SMMState): string {
  // Engagement is typically a terminal node
  return END;
}

/**
 * Route after Approval completes
 */
function routeAfterApproval(state: SMMState): string {
  if (state.current_step === 'approval_error') {
    return END;
  }
  
  // Route based on approval outcome
  if (state.next_step === 'scheduler') {
    return 'scheduler';
  }
  if (state.next_step === 'content_creator') {
    return 'content_creator';
  }
  
  // Still waiting for user response
  if (state.current_step === 'approval_pending') {
    return END;
  }
  
  return END;
}

// =============================================================================
// BUILD WORKFLOW GRAPH
// =============================================================================

function buildSMMWorkflow() {
  const workflow = new StateGraph(SMMAnnotation);
  
  // Add all agent nodes
  (workflow as any).addNode('content_creator', contentCreatorNode);
  (workflow as any).addNode('trend_spotter', trendSpotterNode);
  (workflow as any).addNode('scheduler', schedulerNode);
  (workflow as any).addNode('analytics', analyticsNode);
  (workflow as any).addNode('engagement', engagementNode);
  (workflow as any).addNode('approval', approvalNode);
  
  // Entry point routing
  (workflow as any).addConditionalEdges(
    '__start__',
    routeFromEntry,
    {
      content_creator: 'content_creator',
      trend_spotter: 'trend_spotter',
      scheduler: 'scheduler',
      analytics: 'analytics',
      engagement: 'engagement',
      approval: 'approval',
    }
  );
  
  // Content Creator edges
  (workflow as any).addConditionalEdges(
    'content_creator',
    routeAfterContentCreator,
    {
      approval: 'approval',
      scheduler: 'scheduler',
      [END]: END,
    }
  );
  
  // Trend Spotter edges
  (workflow as any).addConditionalEdges(
    'trend_spotter',
    routeAfterTrendSpotter,
    {
      content_creator: 'content_creator',
      [END]: END,
    }
  );
  
  // Scheduler edges
  (workflow as any).addConditionalEdges(
    'scheduler',
    routeAfterScheduler,
    {
      analytics: 'analytics',
      [END]: END,
    }
  );
  
  // Analytics edges (terminal)
  (workflow as any).addEdge('analytics', END);
  
  // Engagement edges (terminal)
  (workflow as any).addEdge('engagement', END);
  
  // Approval edges
  (workflow as any).addConditionalEdges(
    'approval',
    routeAfterApproval,
    {
      scheduler: 'scheduler',
      content_creator: 'content_creator',
      [END]: END,
    }
  );
  
  return workflow.compile();
}

// =============================================================================
// PUBLIC API
// =============================================================================

// Compiled workflow instance
let compiledWorkflow: ReturnType<typeof buildSMMWorkflow> | null = null;

function getWorkflow() {
  if (!compiledWorkflow) {
    compiledWorkflow = buildSMMWorkflow();
  }
  return compiledWorkflow;
}

/**
 * Run Content Creator workflow
 */
export async function runContentCreatorWorkflow(
  userId: string,
  input: ContentCreatorInput
): Promise<WorkflowState> {
  const workflow = getWorkflow();
  
  const initialState: Partial<SMMState> = {
    agent_id: generateId('smm'),
    user_id: userId,
    entry_point: 'content_creator',
    content_creator_input: input,
    current_step: 'starting',
    started_at: new Date(),
    posts: [],
    trends: [],
    analytics_reports: [],
    engagement_logs: [],
    pending_approvals: [],
    errors: [],
    warnings: [],
    published_count: 0,
    failed_count: 0,
  };
  
  const result = await workflow.invoke(initialState);
  return { ...result, completed_at: new Date() } as unknown as WorkflowState;
}

/**
 * Run Trend Spotter workflow
 */
export async function runTrendSpotterWorkflow(
  userId: string,
  input: TrendSpotterInput
): Promise<WorkflowState> {
  const workflow = getWorkflow();
  
  const initialState: Partial<SMMState> = {
    agent_id: generateId('smm'),
    user_id: userId,
    entry_point: 'trend_spotter',
    trend_spotter_input: input,
    current_step: 'starting',
    started_at: new Date(),
    posts: [],
    trends: [],
    analytics_reports: [],
    engagement_logs: [],
    pending_approvals: [],
    errors: [],
    warnings: [],
    published_count: 0,
    failed_count: 0,
  };
  
  const result = await workflow.invoke(initialState);
  return { ...result, completed_at: new Date() } as unknown as WorkflowState;
}

/**
 * Run Scheduler workflow
 */
export async function runSchedulerWorkflow(
  userId: string,
  input: SchedulerInput
): Promise<WorkflowState> {
  const workflow = getWorkflow();
  
  const initialState: Partial<SMMState> = {
    agent_id: generateId('smm'),
    user_id: userId,
    entry_point: 'scheduler',
    scheduler_input: input,
    current_step: 'starting',
    started_at: new Date(),
    posts: [],
    trends: [],
    analytics_reports: [],
    engagement_logs: [],
    pending_approvals: [],
    errors: [],
    warnings: [],
    published_count: 0,
    failed_count: 0,
  };
  
  const result = await workflow.invoke(initialState);
  return { ...result, completed_at: new Date() } as unknown as WorkflowState;
}

/**
 * Run Analytics workflow
 */
export async function runAnalyticsWorkflow(
  userId: string,
  input: AnalyticsInput
): Promise<WorkflowState> {
  const workflow = getWorkflow();
  
  const initialState: Partial<SMMState> = {
    agent_id: generateId('smm'),
    user_id: userId,
    entry_point: 'analytics',
    analytics_input: input,
    current_step: 'starting',
    started_at: new Date(),
    posts: [],
    trends: [],
    analytics_reports: [],
    engagement_logs: [],
    pending_approvals: [],
    errors: [],
    warnings: [],
    published_count: 0,
    failed_count: 0,
  };
  
  const result = await workflow.invoke(initialState);
  return { ...result, completed_at: new Date() } as unknown as WorkflowState;
}

/**
 * Run Engagement workflow
 */
export async function runEngagementWorkflow(
  userId: string,
  input: EngagementInput
): Promise<WorkflowState> {
  const workflow = getWorkflow();
  
  const initialState: Partial<SMMState> = {
    agent_id: generateId('smm'),
    user_id: userId,
    entry_point: 'engagement',
    engagement_input: input,
    current_step: 'starting',
    started_at: new Date(),
    posts: [],
    trends: [],
    analytics_reports: [],
    engagement_logs: [],
    pending_approvals: [],
    errors: [],
    warnings: [],
    published_count: 0,
    failed_count: 0,
  };
  
  const result = await workflow.invoke(initialState);
  return { ...result, completed_at: new Date() } as unknown as WorkflowState;
}

/**
 * Run Approval workflow
 */
export async function runApprovalWorkflow(
  userId: string,
  input: ApprovalInput
): Promise<WorkflowState> {
  const workflow = getWorkflow();
  
  const initialState: Partial<SMMState> = {
    agent_id: generateId('smm'),
    user_id: userId,
    entry_point: 'approval',
    approval_input: input,
    current_step: 'starting',
    started_at: new Date(),
    posts: [],
    trends: [],
    analytics_reports: [],
    engagement_logs: [],
    pending_approvals: [],
    errors: [],
    warnings: [],
    published_count: 0,
    failed_count: 0,
  };
  
  const result = await workflow.invoke(initialState);
  return { ...result, completed_at: new Date() } as unknown as WorkflowState;
}

/**
 * Resume workflow with existing state (for approval responses, etc.)
 */
export async function resumeWorkflow(
  state: WorkflowState
): Promise<WorkflowState> {
  const workflow = getWorkflow();
  const result = await workflow.invoke(state as unknown as SMMState);
  return { ...result, completed_at: new Date() } as unknown as WorkflowState;
}

// Export the workflow builder for advanced usage
export { buildSMMWorkflow };
