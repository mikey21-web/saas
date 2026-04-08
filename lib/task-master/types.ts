/**
 * Task Master v2 - Type Definitions
 * Converted from n8n workflow to LangGraph TypeScript
 */

// ============================================================================
// Core Task Types
// ============================================================================

export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'overdue'
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly'
export type InputType = 'audio' | 'text' | 'google_calendar' | 'notion' | 'google_docs'
export type DirectorySource = 'google_sheets' | 'supabase' | 'notion' | 'airtable'

export interface Task {
  task_id: string
  title: string
  assignee_name: string
  assignee_phone?: string
  assignee_email?: string
  assignee_whatsapp_id?: string
  deadline: string // ISO 8601
  priority: TaskPriority
  dependencies: string[] // list of task titles
  subtasks: string[]
  is_recurring: boolean
  recurrence_pattern?: RecurrencePattern
  status: TaskStatus
  completion_percent: number
  whatsapp_sent: boolean
  whatsapp_message_id?: string
  notified_at?: string
  contact_found: boolean
  is_duplicate: boolean
  duplicate_task_id?: string
  similarity_score?: number
  meeting_id?: string
  created_at: string
  completed_at?: string
  reminder_24h_sent: boolean
  reminder_2h_sent: boolean
  extension_granted: boolean
  retry_count: number
  parent_task_id?: string
}

// ============================================================================
// Workflow State
// ============================================================================

export interface WorkflowState {
  // Identifiers
  agent_id: string
  user_id: string
  meeting_id: string
  
  // Input
  input_text: string
  input_type: InputType
  directory_source: DirectorySource
  
  // Tasks
  tasks: Task[]
  unrouted_tasks: Task[]
  blocked_tasks: Task[]
  
  // Notifications
  failed_notifications: FailedNotification[]
  
  // Tracking
  completion_status: Record<string, TaskStatus>
  summary_report: string
  
  // Metadata
  current_agent: AgentName
  errors: WorkflowError[]
  cost_tracking: CostTracking
  started_at: string
  completed_at?: string
}

export type AgentName = 'parser' | 'validator' | 'router' | 'notifier' | 'tracker'

// ============================================================================
// Agent Input/Output Types
// ============================================================================

// Parser Agent
export interface ParserInput {
  input_text: string
  input_type: InputType
  meeting_id: string
  user_id: string
}

export interface ParserOutput {
  tasks: Task[]
  raw_extraction: string
  tokens_used: number
}

// Validator Agent
export interface ValidatorInput {
  tasks: Task[]
  user_id: string
}

export interface ValidatorOutput {
  validated_tasks: Task[]
  duplicates_found: number
  tokens_used: number
}

// Router Agent
export interface RouterInput {
  tasks: Task[]
  directory_source: DirectorySource
  user_id: string
}

export interface RouterOutput {
  routed_tasks: Task[]
  unrouted_tasks: Task[]
  contacts_matched: number
}

// Notifier Agent
export interface NotifierInput {
  tasks: Task[]
  user_id: string
}

export interface NotifierOutput {
  sent_tasks: Task[]
  failed_notifications: FailedNotification[]
  whatsapp_cost: number
}

// Tracker Agent
export interface TrackerInput {
  tasks: Task[]
  user_id: string
}

export interface TrackerOutput {
  completion_status: Record<string, TaskStatus>
  summary_report: string
  blocked_tasks: Task[]
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface FailedNotification {
  id: string
  task_id: string
  assignee_whatsapp_id: string
  message: string
  reason: string
  retry_count: number
  next_retry_at: string
  created_at: string
}

export interface WorkflowError {
  agent: AgentName
  error_type: string
  message: string
  timestamp: string
  recoverable: boolean
}

export interface CostTracking {
  openai_tokens: number
  openai_cost_usd: number
  whatsapp_messages: number
  whatsapp_cost_usd: number
  total_cost_usd: number
}

export interface TeamMember {
  id: string
  name: string
  phone?: string
  email?: string
  whatsapp_id?: string
}

export interface ExtensionRequest {
  id: string
  task_id: string
  extension_days: number
  requested_at: string
  status: 'pending' | 'approved' | 'denied'
  resolved_at?: string
}

// ============================================================================
// WhatsApp Types
// ============================================================================

export interface WhatsAppMessage {
  messaging_product: 'whatsapp'
  to: string
  type: 'text' | 'template'
  text?: {
    body: string
  }
}

export interface WhatsAppSendResponse {
  messaging_product: string
  contacts: Array<{ wa_id: string }>
  messages: Array<{ id: string }>
}

export interface WhatsAppWebhookPayload {
  entry: Array<{
    changes: Array<{
      value: {
        messages?: Array<{
          from: string
          text?: { body: string }
          type: string
        }>
      }
    }>
  }>
}

export type ReplyIntent = 
  | 'completed' 
  | 'progress' 
  | 'extension_request' 
  | 'extension_approve' 
  | 'extension_deny' 
  | 'help' 
  | 'query' 
  | 'retry' 
  | 'unknown'

export interface ParsedReply {
  intent: ReplyIntent
  progress_percent?: number
  extension_days?: number
  task_id?: string
  query_text?: string
}

// ============================================================================
// LLM Response Types
// ============================================================================

export interface TaskExtractionResponse {
  tasks: Array<{
    title: string
    assignee_name: string
    deadline?: string
    priority?: TaskPriority
    dependencies?: string[]
    subtasks?: string[]
    is_recurring?: boolean
    recurrence_pattern?: RecurrencePattern
  }>
}

export interface DuplicateCheckResponse {
  is_duplicate: boolean
  duplicate_task_id: string | null
  similarity_score: number
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface TaskMasterConfig {
  // Rate limits
  max_tasks_per_minute: number
  max_daily_cost_usd: number
  max_agent_iterations: number
  
  // Timeouts
  workflow_timeout_minutes: number
  tracker_poll_interval_hours: number
  tracker_no_update_timeout_hours: number
  
  // Retry
  max_notification_retries: number
  retry_interval_minutes: number
  
  // Thresholds
  duplicate_similarity_threshold: number
  
  // Feature flags
  enable_jira: boolean
  enable_slack: boolean
  enable_gemini_fallback: boolean
}

export const DEFAULT_CONFIG: TaskMasterConfig = {
  max_tasks_per_minute: 50,
  max_daily_cost_usd: 500,
  max_agent_iterations: 10,
  workflow_timeout_minutes: 60,
  tracker_poll_interval_hours: 6,
  tracker_no_update_timeout_hours: 24,
  max_notification_retries: 3,
  retry_interval_minutes: 15,
  duplicate_similarity_threshold: 0.85,
  enable_jira: false,
  enable_slack: false,
  enable_gemini_fallback: true,
}

// ============================================================================
// Environment Variables Type
// ============================================================================

export interface TaskMasterEnv {
  // Required
  OPENAI_API_KEY: string
  WHATSAPP_TOKEN: string
  WHATSAPP_PHONE_NUMBER_ID: string
  MANAGER_WHATSAPP: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  
  // Optional
  GOOGLE_CALENDAR_ID?: string
  NOTION_TOKEN?: string
  NOTION_TEAM_DB_ID?: string
  AIRTABLE_API_KEY?: string
  AIRTABLE_BASE_ID?: string
  TEAM_SHEET_ID?: string
  REPORTS_SHEET_ID?: string
  JIRA_PROJECT_KEY?: string
  JIRA_API_TOKEN?: string
  SLACK_BOT_TOKEN?: string
  SLACK_CHANNEL_ID?: string
  GEMINI_API_KEY?: string
}
