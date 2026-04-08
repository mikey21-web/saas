/**
 * Task Master v2 - Router Agent
 * Matches assignees to contacts from various directories
 */

import {
  Task,
  RouterInput,
  RouterOutput,
  WorkflowState,
  DirectorySource,
  TeamMember,
} from '../types'
import {
  lookupContact,
  supabaseSaveTask,
  supabaseSaveUnroutedTask,
  sendWhatsAppNotification,
} from '../integrations'
import {
  enrichTaskWithContact,
  buildUnroutedAlertMessage,
  logAgentTransition,
  logError,
} from '../utils'

// ============================================================================
// Router Agent Node
// ============================================================================

export async function routerAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  logAgentTransition('validator', 'router', {
    tasksToRoute: state.tasks.length,
    directorySource: state.directory_source,
  })

  // If no tasks, skip routing
  if (state.tasks.length === 0) {
    logAgentTransition('router', 'notifier', { reason: 'no_tasks' })
    return {
      current_agent: 'notifier',
    }
  }

  const input: RouterInput = {
    tasks: state.tasks,
    directory_source: state.directory_source,
    user_id: state.user_id,
  }

  try {
    const output = await routeTasks(input)

    logAgentTransition('router', 'notifier', {
      routedTasks: output.routed_tasks.length,
      unroutedTasks: output.unrouted_tasks.length,
      contactsMatched: output.contacts_matched,
    })

    return {
      tasks: output.routed_tasks,
      unrouted_tasks: [...state.unrouted_tasks, ...output.unrouted_tasks],
      current_agent: 'notifier',
    }
  } catch (error) {
    logError('router', error as Error)

    return {
      current_agent: 'notifier',
      errors: [
        ...state.errors,
        {
          agent: 'router',
          error_type: 'ROUTING_FAILED',
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
          recoverable: true,
        },
      ],
    }
  }
}

// ============================================================================
// Task Routing Logic
// ============================================================================

async function routeTasks(input: RouterInput): Promise<RouterOutput> {
  const routedTasks: Task[] = []
  const unroutedTasks: Task[] = []
  let contactsMatched = 0

  // Get manager WhatsApp for alerts
  const managerWhatsApp = process.env.MANAGER_WHATSAPP

  for (const task of input.tasks) {
    try {
      // Look up contact in the specified directory
      const contact = await lookupContactWithFallback(
        task.assignee_name,
        input.directory_source
      )

      if (contact && (contact.phone || contact.whatsapp_id)) {
        // Contact found - enrich task and save
        const enrichedTask = enrichTaskWithContact(task, contact)
        
        // Check for dependencies
        const hasBlockedDeps = await checkDependencies(enrichedTask)
        
        if (hasBlockedDeps) {
          enrichedTask.status = 'blocked'
        }

        // Save to database
        await supabaseSaveTask(enrichedTask)
        
        routedTasks.push(enrichedTask)
        contactsMatched++
      } else {
        // Contact not found - flag as unrouted
        const unroutedTask = {
          ...task,
          contact_found: false,
        }

        // Save to unrouted tasks table
        await supabaseSaveUnroutedTask(unroutedTask)
        unroutedTasks.push(unroutedTask)

        // Alert manager
        if (managerWhatsApp) {
          await alertManagerUnrouted(unroutedTask, managerWhatsApp)
        }
      }
    } catch (error) {
      logError('router', error as Error, { taskId: task.task_id })
      
      // On error, treat as unrouted
      unroutedTasks.push({
        ...task,
        contact_found: false,
      })
    }
  }

  return {
    routed_tasks: routedTasks,
    unrouted_tasks: unroutedTasks,
    contacts_matched: contactsMatched,
  }
}

// ============================================================================
// Contact Lookup with Fallback
// ============================================================================

async function lookupContactWithFallback(
  assigneeName: string,
  primarySource: DirectorySource
): Promise<TeamMember | null> {
  // Define lookup order based on primary source
  const lookupOrder: DirectorySource[] = getlookupOrder(primarySource)

  for (const source of lookupOrder) {
    try {
      const contact = await lookupContact(assigneeName, source)
      
      if (contact && (contact.phone || contact.whatsapp_id)) {
        console.log(`[Router] Found contact for "${assigneeName}" in ${source}`)
        return contact
      }
    } catch (error) {
      logError('router', error as Error, { source, assignee: assigneeName })
    }
  }

  console.log(`[Router] No contact found for "${assigneeName}" in any directory`)
  return null
}

function getlookupOrder(primary: DirectorySource): DirectorySource[] {
  const allSources: DirectorySource[] = ['supabase', 'notion', 'airtable', 'google_sheets']
  
  // Put primary source first
  const order = [primary]
  
  // Add remaining sources
  for (const source of allSources) {
    if (source !== primary) {
      order.push(source)
    }
  }
  
  return order
}

// ============================================================================
// Dependency Checking
// ============================================================================

async function checkDependencies(task: Task): Promise<boolean> {
  if (!task.dependencies || task.dependencies.length === 0) {
    return false
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )

    // Query dependency tasks
    const { data: dependencyTasks } = await client
      .from('tasks')
      .select('title, status')
      .in('title', task.dependencies)

    if (!dependencyTasks || dependencyTasks.length === 0) {
      // Dependencies don't exist yet, not blocked
      return false
    }

    // Check if any dependency is not completed
    const hasIncomplete = dependencyTasks.some(
      (dep: { status: string }) => dep.status !== 'completed'
    )

    return hasIncomplete
  } catch (error) {
    logError('router', error as Error, { operation: 'checkDependencies' })
    return false
  }
}

// ============================================================================
// Manager Alerts
// ============================================================================

async function alertManagerUnrouted(
  task: Task,
  managerWhatsApp: string
): Promise<void> {
  try {
    const message = buildUnroutedAlertMessage(task)
    await sendWhatsAppNotification(managerWhatsApp, message)
    
    console.log(`[Router] Alerted manager about unrouted task: ${task.title}`)
  } catch (error) {
    logError('router', error as Error, { operation: 'alertManager' })
  }
}

// ============================================================================
// Retry Unrouted Tasks
// ============================================================================

export async function retryUnroutedTask(
  taskId: string,
  directorySource: DirectorySource
): Promise<{ success: boolean; task?: Task; error?: string }> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )

    // Get the unrouted task
    const { data: unroutedTask, error: fetchError } = await client
      .from('unrouted_tasks')
      .select('*')
      .eq('task_id', taskId)
      .single()

    if (fetchError || !unroutedTask) {
      return { success: false, error: 'Task not found' }
    }

    // Try to look up contact again
    const contact = await lookupContactWithFallback(
      unroutedTask.assignee_name,
      directorySource
    )

    if (!contact || (!contact.phone && !contact.whatsapp_id)) {
      return { success: false, error: 'Contact still not found' }
    }

    // Create enriched task
    const task: Task = {
      task_id: unroutedTask.task_id,
      title: unroutedTask.title,
      assignee_name: unroutedTask.assignee_name,
      assignee_phone: contact.phone,
      assignee_email: contact.email,
      assignee_whatsapp_id: contact.whatsapp_id,
      deadline: unroutedTask.deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: unroutedTask.priority || 'medium',
      dependencies: unroutedTask.dependencies || [],
      subtasks: unroutedTask.subtasks || [],
      is_recurring: unroutedTask.is_recurring || false,
      recurrence_pattern: unroutedTask.recurrence_pattern,
      status: 'pending',
      completion_percent: 0,
      whatsapp_sent: false,
      contact_found: true,
      is_duplicate: false,
      meeting_id: unroutedTask.meeting_id,
      created_at: unroutedTask.created_at,
      reminder_24h_sent: false,
      reminder_2h_sent: false,
      extension_granted: false,
      retry_count: 0,
    }

    // Save to tasks table
    await supabaseSaveTask(task)

    // Remove from unrouted tasks
    await client
      .from('unrouted_tasks')
      .delete()
      .eq('task_id', taskId)

    return { success: true, task }
  } catch (error) {
    logError('router', error as Error, { operation: 'retryUnrouted', taskId })
    return { success: false, error: (error as Error).message }
  }
}

// ============================================================================
// Batch Contact Resolution
// ============================================================================

export async function resolveAllContacts(
  tasks: Task[],
  directorySource: DirectorySource
): Promise<Map<string, TeamMember | null>> {
  const contactCache = new Map<string, TeamMember | null>()
  
  // Get unique assignee names
  const assigneeNames = tasks.map(t => t.assignee_name)
  const uniqueAssignees = Array.from(new Set(assigneeNames))

  // Look up each assignee
  for (const assigneeName of uniqueAssignees) {
    if (!contactCache.has(assigneeName)) {
      const contact = await lookupContactWithFallback(assigneeName, directorySource)
      contactCache.set(assigneeName, contact)
    }
  }

  return contactCache
}
