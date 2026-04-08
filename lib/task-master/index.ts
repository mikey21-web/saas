/**
 * Task Master v2 - Public API
 * 
 * AI Meeting Notes → WhatsApp Task Assignments → Completion Tracking
 * 
 * A multi-agent workflow converted from n8n to LangGraph TypeScript
 */

// ============================================================================
// Main Workflow
// ============================================================================

export {
  runTaskMasterWorkflow,
  getTaskMasterWorkflow,
  handleWhatsAppReply,
  checkOverdueTasks,
  sendDueReminders,
  generateEveningSummary,
  retryFailedNotifications,
  retryUnroutedTask,
} from './task-master'

export type {
  TaskMasterInput,
  TaskMasterOutput,
} from './task-master'

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  Task,
  TaskPriority,
  TaskStatus,
  RecurrencePattern,
  InputType,
  DirectorySource,
  
  // Workflow state
  WorkflowState,
  AgentName,
  
  // Agent I/O
  ParserInput,
  ParserOutput,
  ValidatorInput,
  ValidatorOutput,
  RouterInput,
  RouterOutput,
  NotifierInput,
  NotifierOutput,
  TrackerInput,
  TrackerOutput,
  
  // Supporting types
  FailedNotification,
  WorkflowError,
  CostTracking,
  TeamMember,
  ExtensionRequest,
  
  // WhatsApp types
  WhatsAppMessage,
  WhatsAppSendResponse,
  WhatsAppWebhookPayload,
  ReplyIntent,
  ParsedReply,
  
  // Configuration
  TaskMasterConfig,
  TaskMasterEnv,
} from './types'

export { DEFAULT_CONFIG } from './types'

// ============================================================================
// Utilities
// ============================================================================

export {
  // Task helpers
  generateTaskId,
  generateMeetingId,
  validateTask,
  
  // Message building
  buildWhatsAppMessage,
  buildReminderMessage,
  buildUnroutedAlertMessage,
  buildExtensionRequestMessage,
  buildExtensionApprovedMessage,
  buildExtensionDeniedMessage,
  buildUnblockedMessage,
  buildOverdueAlertMessage,
  createWhatsAppPayload,
  
  // Contact handling
  normalizeContact,
  enrichTaskWithContact,
  
  // Duplicate detection
  checkDuplicateTasks,
  
  // Deadline calculations
  getDefaultDeadline,
  calculateNewDeadline,
  calculateNextRecurrence,
  isTaskDueSoon,
  isTaskOverdue,
  
  // Reply parsing
  parseReplyText,
  
  // Cost tracking
  calculateOpenAICost,
  calculateWhatsAppCost,
  
  // Logging
  logAgentTransition,
  logError,
  logCost,
} from './utils'

// ============================================================================
// Integrations (for advanced use)
// ============================================================================

export {
  // Clients
  getOpenAIClient,
  getSupabaseClient,
  
  // OpenAI
  openAIExtractTasks,
  openAICheckDuplicate,
  openAIParseReplyIntent,
  openAIGenerateSummary,
  geminiExtractTasks,
  
  // WhatsApp
  metaWhatsAppSend,
  sendWhatsAppNotification,
  
  // Supabase
  supabaseQueryTasks,
  supabaseGetExistingTasks,
  supabaseSaveTask,
  supabaseUpdateTask,
  supabaseSaveUnroutedTask,
  supabaseQueueFailedNotification,
  supabaseGetFailedNotifications,
  supabaseDeleteFailedNotification,
  supabaseSaveExtensionRequest,
  supabaseUpdateExtensionRequest,
  
  // Contact lookup
  lookupContact,
  lookupContactSupabase,
  lookupContactNotion,
  lookupContactAirtable,
  
  // Optional integrations
  createJiraTicket,
  sendSlackNotification,
} from './integrations'

// ============================================================================
// Individual Agents (for custom workflows)
// ============================================================================

export { parserAgent, transcribeAudio } from './agents/parser-agent'
export { validatorAgent, batchValidateTasks, localDuplicateCheck } from './agents/validator-agent'
export { routerAgent, resolveAllContacts } from './agents/router-agent'
export { 
  notifierAgent,
  notifyBlockedTaskUnblocked,
  sendReminderNotification,
  notifyExtensionApproved,
  notifyExtensionDenied,
  notifyManagerOverdue,
  notifyManagerExtensionRequest,
  queueFailedNotification,
} from './agents/notifier-agent'
export { trackerAgent } from './agents/tracker-agent'
