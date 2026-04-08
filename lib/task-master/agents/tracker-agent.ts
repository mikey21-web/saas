/**
 * Task Master v2 - Tracker Agent
 * Monitors task completion, handles replies, generates summaries
 */

import {
  Task,
  TrackerInput,
  TrackerOutput,
  WorkflowState,
  TaskStatus,
  ParsedReply,
  WhatsAppWebhookPayload,
} from '../types'
import {
  supabaseUpdateTask,
  supabaseQueryTasks,
  supabaseSaveExtensionRequest,
  supabaseUpdateExtensionRequest,
  openAIParseReplyIntent,
  openAIGenerateSummary,
  sendWhatsAppNotification,
} from '../integrations'
import {
  parseReplyText,
  calculateNewDeadline,
  isTaskOverdue,
  logAgentTransition,
  logError,
} from '../utils'
import {
  notifyBlockedTaskUnblocked,
  notifyExtensionApproved,
  notifyExtensionDenied,
  notifyManagerExtensionRequest,
  notifyManagerOverdue,
} from './notifier-agent'

// ============================================================================
// Tracker Agent Node
// ============================================================================

export async function trackerAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  logAgentTransition('notifier', 'tracker', {
    tasksToTrack: state.tasks.length,
  })

  const input: TrackerInput = {
    tasks: state.tasks.filter(t => t.whatsapp_sent),
    user_id: state.user_id,
  }

  try {
    const output = await generateTrackingStatus(input, state.unrouted_tasks)

    logAgentTransition('tracker', 'END', {
      completedTasks: Object.values(output.completion_status).filter(s => s === 'completed').length,
      pendingTasks: Object.values(output.completion_status).filter(s => s === 'pending').length,
      blockedTasks: output.blocked_tasks.length,
    })

    return {
      completion_status: output.completion_status,
      summary_report: output.summary_report,
      blocked_tasks: output.blocked_tasks,
      completed_at: new Date().toISOString(),
    }
  } catch (error) {
    logError('tracker', error as Error)

    return {
      completed_at: new Date().toISOString(),
      errors: [
        ...state.errors,
        {
          agent: 'tracker',
          error_type: 'TRACKING_FAILED',
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
          recoverable: false,
        },
      ],
    }
  }
}

// ============================================================================
// Tracking Status Generation
// ============================================================================

async function generateTrackingStatus(
  input: TrackerInput,
  unroutedTasks: Task[]
): Promise<TrackerOutput> {
  const completionStatus: Record<string, TaskStatus> = {}
  const blockedTasks: Task[] = []

  // Build status map from tasks
  for (const task of input.tasks) {
    completionStatus[task.task_id] = task.status
    
    if (task.status === 'blocked') {
      blockedTasks.push(task)
    }
  }

  // Generate summary report
  const summaryReport = await openAIGenerateSummary(input.tasks, unroutedTasks)

  return {
    completion_status: completionStatus,
    summary_report: summaryReport,
    blocked_tasks: blockedTasks,
  }
}

// ============================================================================
// WhatsApp Reply Handling
// ============================================================================

export async function handleWhatsAppReply(
  payload: WhatsAppWebhookPayload
): Promise<{ success: boolean; action?: string; error?: string }> {
  try {
    // Extract message from webhook payload
    const entry = payload.entry?.[0]
    const change = entry?.changes?.[0]?.value
    const message = change?.messages?.[0]

    if (!message?.text?.body || !message.from) {
      return { success: false, error: 'Invalid webhook payload' }
    }

    const replyText = message.text.body
    const fromNumber = message.from
    const isManager = fromNumber === process.env.MANAGER_WHATSAPP?.replace('+', '')

    // Parse reply intent (try local first, then LLM)
    const localParsed = parseReplyText(replyText)
    
    let parsed: ParsedReply
    if (localParsed.intent === 'unknown' || !localParsed.intent) {
      // Use LLM for more complex parsing
      parsed = await openAIParseReplyIntent(replyText)
    } else {
      parsed = localParsed as ParsedReply
    }

    // Handle based on intent
    return await processReplyIntent(parsed, fromNumber, isManager)
  } catch (error) {
    logError('tracker', error as Error, { operation: 'handleWhatsAppReply' })
    return { success: false, error: (error as Error).message }
  }
}

async function processReplyIntent(
  parsed: ParsedReply,
  fromNumber: string,
  isManager: boolean
): Promise<{ success: boolean; action?: string; error?: string }> {
  switch (parsed.intent) {
    case 'completed':
      return handleTaskCompletion(fromNumber, parsed.task_id)

    case 'progress':
      return handleProgressUpdate(fromNumber, parsed.progress_percent, parsed.task_id)

    case 'extension_request':
      return handleExtensionRequest(fromNumber, parsed.extension_days, parsed.task_id)

    case 'extension_approve':
      if (!isManager) {
        return { success: false, error: 'Only manager can approve extensions' }
      }
      return handleExtensionApproval(parsed.task_id!, true)

    case 'extension_deny':
      if (!isManager) {
        return { success: false, error: 'Only manager can deny extensions' }
      }
      return handleExtensionApproval(parsed.task_id!, false)

    case 'retry':
      if (!isManager) {
        return { success: false, error: 'Only manager can retry tasks' }
      }
      return handleRetryTask(parsed.task_id!)

    case 'help':
      return handleHelpRequest(fromNumber)

    case 'query':
      return handleQuery(fromNumber, parsed.query_text)

    default:
      return { success: true, action: 'unknown_intent' }
  }
}

// ============================================================================
// Reply Intent Handlers
// ============================================================================

async function handleTaskCompletion(
  fromNumber: string,
  taskId?: string
): Promise<{ success: boolean; action?: string; error?: string }> {
  try {
    // Find task by phone number or task ID
    const task = await findTaskByPhoneOrId(fromNumber, taskId)
    
    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Update task status
    await supabaseUpdateTask(task.task_id, {
      status: 'completed',
      completion_percent: 100,
      completed_at: new Date().toISOString(),
    })

    // Check and unblock dependent tasks
    await checkAndUnblockDependents(task)

    // Send confirmation
    await sendWhatsAppNotification(
      fromNumber,
      `✅ Great job! Task *${task.title}* marked as complete.`
    )

    return { success: true, action: 'task_completed' }
  } catch (error) {
    logError('tracker', error as Error, { operation: 'handleTaskCompletion' })
    return { success: false, error: (error as Error).message }
  }
}

async function handleProgressUpdate(
  fromNumber: string,
  progressPercent?: number,
  taskId?: string
): Promise<{ success: boolean; action?: string; error?: string }> {
  try {
    const task = await findTaskByPhoneOrId(fromNumber, taskId)
    
    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    const progress = progressPercent ?? 50

    await supabaseUpdateTask(task.task_id, {
      status: 'in_progress',
      completion_percent: progress,
    })

    await sendWhatsAppNotification(
      fromNumber,
      `📊 Progress updated! *${task.title}* is now at ${progress}%.`
    )

    return { success: true, action: 'progress_updated' }
  } catch (error) {
    logError('tracker', error as Error, { operation: 'handleProgressUpdate' })
    return { success: false, error: (error as Error).message }
  }
}

async function handleExtensionRequest(
  fromNumber: string,
  extensionDays?: number,
  taskId?: string
): Promise<{ success: boolean; action?: string; error?: string }> {
  try {
    const task = await findTaskByPhoneOrId(fromNumber, taskId)
    
    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Save extension request
    await supabaseSaveExtensionRequest({
      task_id: task.task_id,
      extension_days: extensionDays ?? 2,
      requested_at: new Date().toISOString(),
      status: 'pending',
    })

    // Notify manager
    await notifyManagerExtensionRequest(task, extensionDays)

    // Confirm to user
    await sendWhatsAppNotification(
      fromNumber,
      `⏰ Extension request sent for *${task.title}*. Your manager will respond shortly.`
    )

    return { success: true, action: 'extension_requested' }
  } catch (error) {
    logError('tracker', error as Error, { operation: 'handleExtensionRequest' })
    return { success: false, error: (error as Error).message }
  }
}

async function handleExtensionApproval(
  taskId: string,
  approved: boolean
): Promise<{ success: boolean; action?: string; error?: string }> {
  try {
    // Get task
    const tasks = await supabaseQueryTasks('', { status: '' })
    const task = tasks.find(t => t.task_id === taskId)
    
    if (!task) {
      return { success: false, error: 'Task not found' }
    }

    // Update extension request status
    await supabaseUpdateExtensionRequest(taskId, approved ? 'approved' : 'denied')

    if (approved) {
      // Calculate new deadline (default 2 days)
      const newDeadline = calculateNewDeadline(task.deadline, 2)
      
      // Update task deadline
      await supabaseUpdateTask(taskId, {
        deadline: newDeadline,
        extension_granted: true,
      })

      // Notify assignee
      await notifyExtensionApproved(task, newDeadline, 2)
    } else {
      // Notify assignee of denial
      await notifyExtensionDenied(task)
    }

    return { success: true, action: approved ? 'extension_approved' : 'extension_denied' }
  } catch (error) {
    logError('tracker', error as Error, { operation: 'handleExtensionApproval' })
    return { success: false, error: (error as Error).message }
  }
}

async function handleRetryTask(
  taskId: string
): Promise<{ success: boolean; action?: string; error?: string }> {
  try {
    const { retryUnroutedTask } = await import('./router-agent')
    const result = await retryUnroutedTask(taskId, 'supabase')
    
    if (result.success) {
      return { success: true, action: 'task_retried' }
    }
    
    return { success: false, error: result.error }
  } catch (error) {
    logError('tracker', error as Error, { operation: 'handleRetryTask' })
    return { success: false, error: (error as Error).message }
  }
}

async function handleHelpRequest(
  fromNumber: string
): Promise<{ success: boolean; action?: string; error?: string }> {
  const helpMessage = `🤖 *Task Master Help*\n\n` +
    `Here's what you can do:\n\n` +
    `✅ Reply *Done* to mark task complete\n` +
    `📊 Reply *50%* (or any %) to update progress\n` +
    `⏰ Reply *More time* to request extension\n` +
    `❓ Reply *Help* to see this message\n\n` +
    `Need human help? Contact your manager.`

  await sendWhatsAppNotification(fromNumber, helpMessage)
  return { success: true, action: 'help_sent' }
}

async function handleQuery(
  fromNumber: string,
  queryText?: string
): Promise<{ success: boolean; action?: string; error?: string }> {
  // For queries, just acknowledge - manager will handle
  await sendWhatsAppNotification(
    fromNumber,
    `📝 Got your message. A team member will follow up if needed.`
  )
  return { success: true, action: 'query_acknowledged' }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function findTaskByPhoneOrId(
  phoneNumber: string,
  taskId?: string
): Promise<Task | null> {
  try {
    const allTasks = await supabaseQueryTasks('')

    // First try by task ID
    if (taskId) {
      const task = allTasks.find(t => t.task_id === taskId)
      if (task) return task
    }

    // Then try by phone number - get most recent non-completed task
    const phoneMatches = allTasks
      .filter(t => 
        t.assignee_whatsapp_id === phoneNumber &&
        t.status !== 'completed'
      )
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

    return phoneMatches[0] || null
  } catch (error) {
    logError('tracker', error as Error, { operation: 'findTaskByPhoneOrId' })
    return null
  }
}

async function checkAndUnblockDependents(completedTask: Task): Promise<void> {
  try {
    // Get blocked tasks
    const allTasks = await supabaseQueryTasks('')
    const blockedTasks = allTasks.filter(t => t.status === 'blocked')

    for (const blocked of blockedTasks) {
      // Check if this task depends on the completed task
      if (blocked.dependencies?.includes(completedTask.title)) {
        // Check if all other dependencies are complete
        const otherDeps = blocked.dependencies.filter(d => d !== completedTask.title)
        
        const allDepsComplete = otherDeps.every(dep => {
          const depTask = allTasks.find(t => t.title === dep)
          return !depTask || depTask.status === 'completed'
        })

        if (allDepsComplete) {
          // Unblock and notify
          await notifyBlockedTaskUnblocked(blocked)
        }
      }
    }
  } catch (error) {
    logError('tracker', error as Error, { operation: 'checkAndUnblockDependents' })
  }
}

// ============================================================================
// Scheduled Tasks
// ============================================================================

export async function checkOverdueTasks(): Promise<number> {
  try {
    const allTasks = await supabaseQueryTasks('')
    let overdueCount = 0

    for (const task of allTasks) {
      if (
        task.status !== 'completed' &&
        task.status !== 'overdue' &&
        isTaskOverdue(task)
      ) {
        // Mark as overdue
        await supabaseUpdateTask(task.task_id, { status: 'overdue' })
        
        // Notify manager
        await notifyManagerOverdue(task)
        
        overdueCount++
      }
    }

    return overdueCount
  } catch (error) {
    logError('tracker', error as Error, { operation: 'checkOverdueTasks' })
    return 0
  }
}

export async function sendDueReminders(): Promise<{ sent24h: number; sent2h: number }> {
  try {
    const { sendReminderNotification } = await import('./notifier-agent')
    const { isTaskDueSoon } = await import('../utils')
    
    const allTasks = await supabaseQueryTasks('')
    let sent24h = 0
    let sent2h = 0

    for (const task of allTasks) {
      if (task.status === 'completed' || task.status === 'overdue') {
        continue
      }

      // Check 24h reminder
      if (!task.reminder_24h_sent && isTaskDueSoon(task, 24)) {
        const success = await sendReminderNotification(task, 24)
        if (success) sent24h++
      }

      // Check 2h reminder
      if (!task.reminder_2h_sent && isTaskDueSoon(task, 2)) {
        const success = await sendReminderNotification(task, 2)
        if (success) sent2h++
      }
    }

    return { sent24h, sent2h }
  } catch (error) {
    logError('tracker', error as Error, { operation: 'sendDueReminders' })
    return { sent24h: 0, sent2h: 0 }
  }
}

export async function generateEveningSummary(): Promise<string> {
  try {
    // Get today's tasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const allTasks = await supabaseQueryTasks('')
    const todaysTasks = allTasks.filter(t => 
      new Date(t.created_at) >= today
    )

    // For unrouted tasks, query separately
    const { getSupabaseClient } = await import('../integrations')
    const client = getSupabaseClient()
    
    const { data: unroutedTasks } = await client
      .from('unrouted_tasks')
      .select('*')
      .gte('created_at', today.toISOString())

    // Generate summary
    const summary = await openAIGenerateSummary(todaysTasks, unroutedTasks || [])

    // Send to manager
    const managerWhatsApp = process.env.MANAGER_WHATSAPP
    if (managerWhatsApp) {
      await sendWhatsAppNotification(managerWhatsApp, summary)
    }

    return summary
  } catch (error) {
    logError('tracker', error as Error, { operation: 'generateEveningSummary' })
    return 'Failed to generate summary'
  }
}
