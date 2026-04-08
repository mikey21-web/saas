/**
 * Task Master v2 - Notifier Agent
 * Sends WhatsApp notifications and handles optional Jira/Slack integrations
 */

import {
  Task,
  NotifierInput,
  NotifierOutput,
  WorkflowState,
  FailedNotification,
} from '../types'
import {
  sendWhatsAppNotification,
  supabaseUpdateTask,
  supabaseQueueFailedNotification,
  createJiraTicket,
  sendSlackNotification,
} from '../integrations'
import {
  buildWhatsAppMessage,
  calculateWhatsAppCost,
  logAgentTransition,
  logError,
  logCost,
} from '../utils'
import { DEFAULT_CONFIG } from '../types'

// ============================================================================
// Notifier Agent Node
// ============================================================================

export async function notifierAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  logAgentTransition('router', 'notifier', {
    tasksToNotify: state.tasks.length,
  })

  // Filter to tasks with contacts that are not blocked
  const notifiableTasks = state.tasks.filter(
    task => task.contact_found && task.assignee_whatsapp_id && task.status !== 'blocked'
  )

  if (notifiableTasks.length === 0) {
    logAgentTransition('notifier', 'tracker', { reason: 'no_notifiable_tasks' })
    return {
      current_agent: 'tracker',
    }
  }

  const input: NotifierInput = {
    tasks: notifiableTasks,
    user_id: state.user_id,
  }

  try {
    const output = await sendNotifications(input)

    // Update tasks with notification status
    const updatedTasks = state.tasks.map(task => {
      const sentTask = output.sent_tasks.find(t => t.task_id === task.task_id)
      if (sentTask) {
        return sentTask
      }
      return task
    })

    logAgentTransition('notifier', 'tracker', {
      sentCount: output.sent_tasks.filter(t => t.whatsapp_sent).length,
      failedCount: output.failed_notifications.length,
      whatsappCost: output.whatsapp_cost,
    })

    return {
      tasks: updatedTasks,
      failed_notifications: [...state.failed_notifications, ...output.failed_notifications],
      current_agent: 'tracker',
      cost_tracking: {
        ...state.cost_tracking,
        whatsapp_messages: state.cost_tracking.whatsapp_messages + output.sent_tasks.filter(t => t.whatsapp_sent).length,
        whatsapp_cost_usd: state.cost_tracking.whatsapp_cost_usd + output.whatsapp_cost,
        total_cost_usd: state.cost_tracking.total_cost_usd + output.whatsapp_cost,
      },
    }
  } catch (error) {
    logError('notifier', error as Error)

    return {
      current_agent: 'tracker',
      errors: [
        ...state.errors,
        {
          agent: 'notifier',
          error_type: 'NOTIFICATION_FAILED',
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
          recoverable: true,
        },
      ],
    }
  }
}

// ============================================================================
// Notification Logic
// ============================================================================

async function sendNotifications(input: NotifierInput): Promise<NotifierOutput> {
  const sentTasks: Task[] = []
  const failedNotifications: FailedNotification[] = []
  let whatsappCost = 0

  // Rate limiting: Process in batches
  const batchSize = 10
  const delayBetweenBatches = 1000 // 1 second

  for (let i = 0; i < input.tasks.length; i += batchSize) {
    const batch = input.tasks.slice(i, i + batchSize)

    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map(task => sendTaskNotification(task))
    )

    // Handle results
    results.forEach((result, index) => {
      const task = batch[index]

      if (result.status === 'fulfilled' && result.value.success) {
        const updatedTask: Task = {
          ...task,
          whatsapp_sent: true,
          whatsapp_message_id: result.value.messageId,
          notified_at: new Date().toISOString(),
          retry_count: 0,
        }
        sentTasks.push(updatedTask)
        whatsappCost += calculateWhatsAppCost(1)
      } else {
        // Queue for retry
        sentTasks.push({
          ...task,
          whatsapp_sent: false,
          retry_count: task.retry_count + 1,
        })

        const errorMessage = result.status === 'rejected' 
          ? result.reason?.message 
          : result.value?.error

        failedNotifications.push({
          id: `failed_${task.task_id}_${Date.now()}`,
          task_id: task.task_id,
          assignee_whatsapp_id: task.assignee_whatsapp_id!,
          message: buildWhatsAppMessage(task),
          reason: errorMessage || 'Unknown error',
          retry_count: 1,
          next_retry_at: new Date(Date.now() + DEFAULT_CONFIG.retry_interval_minutes * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        })
      }
    })

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < input.tasks.length) {
      await sleep(delayBetweenBatches)
    }
  }

  // Log total cost
  logCost('WhatsApp notifications batch', whatsappCost, {
    sentCount: sentTasks.filter(t => t.whatsapp_sent).length,
  })

  return {
    sent_tasks: sentTasks,
    failed_notifications: failedNotifications,
    whatsapp_cost: whatsappCost,
  }
}

// ============================================================================
// Individual Task Notification
// ============================================================================

async function sendTaskNotification(
  task: Task
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!task.assignee_whatsapp_id) {
    return { success: false, error: 'No WhatsApp ID' }
  }

  try {
    // Build and send WhatsApp message
    const message = buildWhatsAppMessage(task)
    const result = await sendWhatsAppNotification(task.assignee_whatsapp_id, message)

    if (result.success && result.messageId) {
      // Update task in database
      await supabaseUpdateTask(task.task_id, {
        whatsapp_sent: true,
        whatsapp_message_id: result.messageId,
        notified_at: new Date().toISOString(),
      })

      // Send optional integrations (don't await - fire and forget)
      sendOptionalIntegrations(task).catch(err => 
        logError('notifier', err, { operation: 'optionalIntegrations' })
      )

      return { success: true, messageId: result.messageId }
    }

    return { success: false, error: result.error }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================================
// Optional Integrations (Jira, Slack)
// ============================================================================

async function sendOptionalIntegrations(task: Task): Promise<void> {
  const promises: Promise<unknown>[] = []

  // Jira integration
  if (DEFAULT_CONFIG.enable_jira && process.env.JIRA_PROJECT_KEY) {
    promises.push(
      createJiraTicket(task).then(ticketId => {
        if (ticketId) {
          console.log(`[Notifier] Created Jira ticket: ${ticketId} for task: ${task.title}`)
        }
      })
    )
  }

  // Slack integration
  if (DEFAULT_CONFIG.enable_slack && process.env.SLACK_CHANNEL_ID) {
    promises.push(
      sendSlackNotification(task).then(success => {
        if (success) {
          console.log(`[Notifier] Sent Slack notification for task: ${task.title}`)
        }
      })
    )
  }

  await Promise.allSettled(promises)
}

// ============================================================================
// Blocked Task Notifications
// ============================================================================

export async function notifyBlockedTaskUnblocked(task: Task): Promise<boolean> {
  if (!task.assignee_whatsapp_id) {
    return false
  }

  try {
    const { buildUnblockedMessage } = await import('../utils')
    const message = buildUnblockedMessage(task)
    
    const result = await sendWhatsAppNotification(task.assignee_whatsapp_id, message)
    
    if (result.success) {
      await supabaseUpdateTask(task.task_id, {
        status: 'pending',
        whatsapp_sent: true,
        notified_at: new Date().toISOString(),
      })
    }

    return result.success
  } catch (error) {
    logError('notifier', error as Error, { operation: 'unblockedNotification' })
    return false
  }
}

// ============================================================================
// Reminder Notifications
// ============================================================================

export async function sendReminderNotification(
  task: Task,
  hoursRemaining: number
): Promise<boolean> {
  if (!task.assignee_whatsapp_id) {
    return false
  }

  try {
    const { buildReminderMessage } = await import('../utils')
    const message = buildReminderMessage(task, hoursRemaining)
    
    const result = await sendWhatsAppNotification(task.assignee_whatsapp_id, message)
    
    if (result.success) {
      // Update reminder sent flag
      const updateField = hoursRemaining <= 2 ? 'reminder_2h_sent' : 'reminder_24h_sent'
      await supabaseUpdateTask(task.task_id, { [updateField]: true })
    }

    return result.success
  } catch (error) {
    logError('notifier', error as Error, { operation: 'reminderNotification' })
    return false
  }
}

// ============================================================================
// Extension Response Notifications
// ============================================================================

export async function notifyExtensionApproved(
  task: Task,
  newDeadline: string,
  extensionDays: number
): Promise<boolean> {
  if (!task.assignee_whatsapp_id) {
    return false
  }

  try {
    const { buildExtensionApprovedMessage } = await import('../utils')
    const message = buildExtensionApprovedMessage(task, newDeadline, extensionDays)
    
    const result = await sendWhatsAppNotification(task.assignee_whatsapp_id, message)
    return result.success
  } catch (error) {
    logError('notifier', error as Error, { operation: 'extensionApprovedNotification' })
    return false
  }
}

export async function notifyExtensionDenied(task: Task): Promise<boolean> {
  if (!task.assignee_whatsapp_id) {
    return false
  }

  try {
    const { buildExtensionDeniedMessage } = await import('../utils')
    const message = buildExtensionDeniedMessage(task)
    
    const result = await sendWhatsAppNotification(task.assignee_whatsapp_id, message)
    return result.success
  } catch (error) {
    logError('notifier', error as Error, { operation: 'extensionDeniedNotification' })
    return false
  }
}

// ============================================================================
// Manager Notifications
// ============================================================================

export async function notifyManagerOverdue(task: Task): Promise<boolean> {
  const managerWhatsApp = process.env.MANAGER_WHATSAPP
  if (!managerWhatsApp) {
    return false
  }

  try {
    const { buildOverdueAlertMessage } = await import('../utils')
    const message = buildOverdueAlertMessage(task)
    
    const result = await sendWhatsAppNotification(managerWhatsApp, message)
    return result.success
  } catch (error) {
    logError('notifier', error as Error, { operation: 'overdueNotification' })
    return false
  }
}

export async function notifyManagerExtensionRequest(
  task: Task,
  extensionDays?: number
): Promise<boolean> {
  const managerWhatsApp = process.env.MANAGER_WHATSAPP
  if (!managerWhatsApp) {
    return false
  }

  try {
    const { buildExtensionRequestMessage } = await import('../utils')
    const message = buildExtensionRequestMessage(task, extensionDays)
    
    const result = await sendWhatsAppNotification(managerWhatsApp, message)
    return result.success
  } catch (error) {
    logError('notifier', error as Error, { operation: 'extensionRequestNotification' })
    return false
  }
}

// ============================================================================
// Queue Failed Notification
// ============================================================================

export async function queueFailedNotification(
  task: Task,
  error: string
): Promise<void> {
  try {
    await supabaseQueueFailedNotification({
      task_id: task.task_id,
      assignee_whatsapp_id: task.assignee_whatsapp_id!,
      message: buildWhatsAppMessage(task),
      reason: error,
      retry_count: 1,
      next_retry_at: new Date(Date.now() + DEFAULT_CONFIG.retry_interval_minutes * 60 * 1000).toISOString(),
    })
  } catch (err) {
    logError('notifier', err as Error, { operation: 'queueFailedNotification' })
  }
}

// ============================================================================
// Helpers
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
