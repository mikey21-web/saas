/**
 * Task Master v2 - Utility Functions
 * Helper functions for task processing, message building, and data normalization
 */

import {
  Task,
  TaskPriority,
  TeamMember,
  WhatsAppMessage,
  DuplicateCheckResponse,
  ParsedReply,
  ReplyIntent,
} from './types'

// ============================================================================
// Task ID Generation
// ============================================================================

export function generateTaskId(index: number = 0): string {
  return `task_${Date.now()}_${index}`
}

export function generateMeetingId(): string {
  return `meeting_${Date.now()}`
}

// ============================================================================
// WhatsApp Message Building
// ============================================================================

export function buildWhatsAppMessage(task: Task): string {
  const deadline = new Date(task.deadline).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const priorityEmoji: Record<TaskPriority, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  }

  let message = `👋 Hi ${task.assignee_name}!\n\n`
  message += `You have a new task from today's meeting:\n\n`
  message += `${priorityEmoji[task.priority]} *${task.title}*\n`
  message += `📅 Deadline: ${deadline}`

  // Add subtasks if present
  if (task.subtasks?.length > 0) {
    message += '\n\n📋 Subtasks:\n'
    task.subtasks.forEach((subtask, i) => {
      message += `  ${i + 1}. ${subtask}\n`
    })
  }

  // Add dependencies if present
  if (task.dependencies?.length > 0) {
    message += `\n\n⚠️ Note: Depends on: ${task.dependencies.join(', ')}`
  }

  // Add recurring note
  if (task.is_recurring && task.recurrence_pattern) {
    message += `\n\n🔁 This is a recurring task (${task.recurrence_pattern})`
  }

  // Add reply instructions
  message += '\n\nReply with:\n'
  message += '✅ *Done* — mark complete\n'
  message += '📊 *50%* — update progress\n'
  message += '⏰ *More time* — request extension\n'
  message += '❓ *Help* — get assistance\n'
  message += `\nTask ID: \`${task.task_id}\``

  return message
}

export function buildReminderMessage(task: Task, hoursRemaining: number): string {
  const urgencyPrefix = hoursRemaining <= 2 ? '🚨 URGENT' : '⏰ Reminder'
  const deadline = new Date(task.deadline).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  })

  return `${urgencyPrefix}: *${task.title}* is due in ${hoursRemaining} hours!\n\n` +
    `Progress: ${task.completion_percent}%\n` +
    `Deadline: ${deadline}\n\n` +
    `Reply *Done*, *${task.completion_percent + 20}%*, or *More time*`
}

export function buildUnroutedAlertMessage(task: Task): string {
  return `⚠️ Could not assign task:\n` +
    `*${task.title}*\n\n` +
    `Assignee *${task.assignee_name}* not found in directory.\n\n` +
    `Please add them to the team directory and reply *retry ${task.task_id}*`
}

export function buildExtensionRequestMessage(task: Task, extensionDays?: number): string {
  const deadline = new Date(task.deadline).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  })
  
  return `⏰ Extension Request\n\n` +
    `*${task.assignee_name}* needs more time for:\n` +
    `*${task.title}*\n\n` +
    `Original deadline: ${deadline}\n` +
    `Days requested: ${extensionDays ?? 'Not specified'}\n\n` +
    `Reply:\n` +
    `✅ *Approve ${task.task_id}*\n` +
    `❌ *Deny ${task.task_id}*`
}

export function buildExtensionApprovedMessage(task: Task, newDeadline: string, extensionDays: number): string {
  const formattedDeadline = new Date(newDeadline).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  })
  
  return `✅ Extension approved!\n\n` +
    `Your new deadline for *${task.title}* is:\n` +
    `📅 ${formattedDeadline}\n\n` +
    `You got ${extensionDays} extra day(s). Make it count! 💪`
}

export function buildExtensionDeniedMessage(task: Task): string {
  return `❌ Extension not approved.\n\n` +
    `Please complete *${task.title}* by the original deadline.\n\n` +
    `Reply *Help* if you need support.`
}

export function buildUnblockedMessage(task: Task): string {
  const deadline = new Date(task.deadline).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  })
  
  return `✅ Good news! Your task *${task.title}* is now unblocked and ready to start.\n\n` +
    `Deadline: ${deadline}\n\n` +
    `Reply *Done*, *50%*, or *More time*`
}

export function buildOverdueAlertMessage(task: Task): string {
  const deadline = new Date(task.deadline).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  })
  
  return `❌ Overdue Task Alert\n\n` +
    `*${task.title}*\n` +
    `Assignee: ${task.assignee_name}\n` +
    `Was due: ${deadline}\n` +
    `Progress: ${task.completion_percent}%`
}

export function createWhatsAppPayload(to: string, body: string): WhatsAppMessage {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  }
}

// ============================================================================
// Contact Normalization
// ============================================================================

export interface RawContact {
  name?: string
  phone?: string
  email?: string
  whatsapp_id?: string
  // Notion format
  properties?: {
    Name?: { title: Array<{ plain_text: string }> }
    Phone?: { phone_number: string }
    Email?: { email: string }
  }
  // Airtable format
  fields?: {
    Name?: string
    Phone?: string
    Email?: string
  }
}

export function normalizeContact(
  rawContacts: RawContact | RawContact[] | { results?: RawContact[] } | { records?: Array<{ fields: Record<string, string> }> },
  assigneeName: string
): TeamMember | null {
  const nameLower = assigneeName.toLowerCase()

  // Handle array of contacts (Supabase/Google Sheets format)
  if (Array.isArray(rawContacts)) {
    const match = rawContacts.find((c) =>
      c.name?.toLowerCase().includes(nameLower)
    )
    if (match) {
      return {
        id: match.name ?? assigneeName,
        name: match.name ?? assigneeName,
        phone: match.phone,
        email: match.email,
        whatsapp_id: match.whatsapp_id ?? match.phone,
      }
    }
    return null
  }

  // Handle Notion format
  if ('results' in rawContacts && rawContacts.results) {
    const match = rawContacts.results[0]
    if (match?.properties) {
      const props = match.properties
      return {
        id: props.Name?.title?.[0]?.plain_text ?? assigneeName,
        name: props.Name?.title?.[0]?.plain_text ?? assigneeName,
        phone: props.Phone?.phone_number,
        email: props.Email?.email,
        whatsapp_id: props.Phone?.phone_number,
      }
    }
    return null
  }

  // Handle Airtable format
  if ('records' in rawContacts && rawContacts.records) {
    const match = rawContacts.records[0]
    if (match?.fields) {
      return {
        id: match.fields.Name ?? assigneeName,
        name: match.fields.Name ?? assigneeName,
        phone: match.fields.Phone,
        email: match.fields.Email,
        whatsapp_id: match.fields.Phone,
      }
    }
    return null
  }

  // Handle single contact object
  if ('name' in rawContacts || 'phone' in rawContacts) {
    const contact = rawContacts as RawContact
    return {
      id: contact.name ?? assigneeName,
      name: contact.name ?? assigneeName,
      phone: contact.phone,
      email: contact.email,
      whatsapp_id: contact.whatsapp_id ?? contact.phone,
    }
  }

  return null
}

export function enrichTaskWithContact(task: Task, contact: TeamMember | null): Task {
  if (!contact) {
    return {
      ...task,
      contact_found: false,
    }
  }

  return {
    ...task,
    assignee_phone: contact.phone,
    assignee_email: contact.email,
    assignee_whatsapp_id: contact.whatsapp_id,
    contact_found: !!contact.phone || !!contact.whatsapp_id,
  }
}

// ============================================================================
// Duplicate Detection
// ============================================================================

export function checkDuplicateTasks(
  newTask: Task,
  existingTasks: Task[],
  llmResponse: DuplicateCheckResponse
): Task {
  if (llmResponse.is_duplicate && llmResponse.similarity_score >= 0.85) {
    return {
      ...newTask,
      is_duplicate: true,
      duplicate_task_id: llmResponse.duplicate_task_id ?? undefined,
      similarity_score: llmResponse.similarity_score,
    }
  }

  return {
    ...newTask,
    is_duplicate: false,
    similarity_score: llmResponse.similarity_score,
  }
}

// ============================================================================
// Deadline Calculations
// ============================================================================

export function getDefaultDeadline(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(17, 0, 0, 0) // 5 PM IST
  return tomorrow.toISOString()
}

export function calculateNewDeadline(currentDeadline: string, extensionDays: number): string {
  const deadline = new Date(currentDeadline)
  deadline.setDate(deadline.getDate() + extensionDays)
  return deadline.toISOString()
}

export function calculateNextRecurrence(
  currentDeadline: string,
  pattern: 'daily' | 'weekly' | 'monthly'
): string {
  const nextDeadline = new Date(currentDeadline)

  switch (pattern) {
    case 'daily':
      nextDeadline.setDate(nextDeadline.getDate() + 1)
      break
    case 'weekly':
      nextDeadline.setDate(nextDeadline.getDate() + 7)
      break
    case 'monthly':
      nextDeadline.setMonth(nextDeadline.getMonth() + 1)
      break
  }

  return nextDeadline.toISOString()
}

export function isTaskDueSoon(task: Task, hoursThreshold: number): boolean {
  const now = new Date()
  const deadline = new Date(task.deadline)
  const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursRemaining > 0 && hoursRemaining <= hoursThreshold
}

export function isTaskOverdue(task: Task): boolean {
  return new Date(task.deadline) < new Date()
}

// ============================================================================
// Reply Parsing
// ============================================================================

export function parseReplyText(text: string): Partial<ParsedReply> {
  const normalizedText = text.toLowerCase().trim()

  // Check for completion
  if (normalizedText.includes('done') || normalizedText.includes('complete')) {
    return { intent: 'completed' as ReplyIntent }
  }

  // Check for progress update (e.g., "50%", "80%")
  const progressMatch = normalizedText.match(/(\d+)\s*%/)
  if (progressMatch) {
    return {
      intent: 'progress' as ReplyIntent,
      progress_percent: parseInt(progressMatch[1], 10),
    }
  }

  // Check for extension request
  if (normalizedText.includes('more time') || normalizedText.includes('extension')) {
    const daysMatch = normalizedText.match(/(\d+)\s*day/)
    return {
      intent: 'extension_request' as ReplyIntent,
      extension_days: daysMatch ? parseInt(daysMatch[1], 10) : undefined,
    }
  }

  // Check for manager approval/denial
  if (normalizedText.includes('approve')) {
    const taskIdMatch = normalizedText.match(/approve\s+(\S+)/)
    return {
      intent: 'extension_approve' as ReplyIntent,
      task_id: taskIdMatch?.[1],
    }
  }

  if (normalizedText.includes('deny')) {
    const taskIdMatch = normalizedText.match(/deny\s+(\S+)/)
    return {
      intent: 'extension_deny' as ReplyIntent,
      task_id: taskIdMatch?.[1],
    }
  }

  // Check for retry command
  if (normalizedText.includes('retry')) {
    const taskIdMatch = normalizedText.match(/retry\s+(\S+)/)
    return {
      intent: 'retry' as ReplyIntent,
      task_id: taskIdMatch?.[1],
    }
  }

  // Check for help
  if (normalizedText.includes('help')) {
    return { intent: 'help' as ReplyIntent }
  }

  return { intent: 'unknown' as ReplyIntent, query_text: text }
}

// ============================================================================
// Cost Tracking
// ============================================================================

// OpenAI pricing (approximate, per 1K tokens)
const OPENAI_PRICING = {
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'whisper': 0.006, // per minute
}

export function calculateOpenAICost(
  model: 'gpt-4o' | 'gpt-4o-mini',
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = OPENAI_PRICING[model]
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output
}

export function calculateWhatsAppCost(messageCount: number): number {
  // Meta WhatsApp Business API pricing (approximate)
  // Utility messages: ~$0.005 per message
  return messageCount * 0.005
}

// ============================================================================
// Validation
// ============================================================================

export function validateTask(task: Partial<Task>): string[] {
  const errors: string[] = []

  if (!task.title?.trim()) {
    errors.push('Task title is required')
  }

  if (!task.assignee_name?.trim()) {
    errors.push('Assignee name is required')
  }

  if (task.deadline && isNaN(Date.parse(task.deadline))) {
    errors.push('Invalid deadline format')
  }

  if (task.priority && !['high', 'medium', 'low'].includes(task.priority)) {
    errors.push('Invalid priority value')
  }

  if (task.completion_percent !== undefined && 
      (task.completion_percent < 0 || task.completion_percent > 100)) {
    errors.push('Completion percent must be between 0 and 100')
  }

  return errors
}

// ============================================================================
// Logging Helpers
// ============================================================================

export function logAgentTransition(
  from: string,
  to: string,
  context?: Record<string, unknown>
): void {
  console.log(`[TaskMaster] Agent transition: ${from} → ${to}`, context ?? '')
}

export function logError(
  agent: string,
  error: Error,
  context?: Record<string, unknown>
): void {
  console.error(`[TaskMaster:${agent}] Error:`, error.message, context ?? '')
}

export function logCost(
  operation: string,
  cost: number,
  details?: Record<string, unknown>
): void {
  console.log(`[TaskMaster:Cost] ${operation}: $${cost.toFixed(4)}`, details ?? '')
}
