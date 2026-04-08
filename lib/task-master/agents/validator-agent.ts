/**
 * Task Master v2 - Validator Agent
 * Checks for duplicate tasks using semantic similarity
 */

import {
  Task,
  ValidatorInput,
  ValidatorOutput,
  WorkflowState,
} from '../types'
import {
  openAICheckDuplicate,
  supabaseGetExistingTasks,
} from '../integrations'
import {
  checkDuplicateTasks,
  logAgentTransition,
  logError,
} from '../utils'

// ============================================================================
// Validator Agent Node
// ============================================================================

export async function validatorAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  logAgentTransition('parser', 'validator', {
    tasksToValidate: state.tasks.length,
  })

  // If no tasks, skip validation
  if (state.tasks.length === 0) {
    logAgentTransition('validator', 'router', { reason: 'no_tasks' })
    return {
      current_agent: 'router',
    }
  }

  const input: ValidatorInput = {
    tasks: state.tasks,
    user_id: state.user_id,
  }

  try {
    const output = await validateTasks(input)

    // Filter out duplicates
    const nonDuplicateTasks = output.validated_tasks.filter(t => !t.is_duplicate)
    const duplicates = output.validated_tasks.filter(t => t.is_duplicate)

    logAgentTransition('validator', 'router', {
      validTasks: nonDuplicateTasks.length,
      duplicatesFound: duplicates.length,
      tokensUsed: output.tokens_used,
    })

    // Log duplicates for reference
    if (duplicates.length > 0) {
      console.log('[TaskMaster:Validator] Skipped duplicates:', 
        duplicates.map(d => ({ title: d.title, similarTo: d.duplicate_task_id }))
      )
    }

    return {
      tasks: nonDuplicateTasks,
      current_agent: 'router',
      cost_tracking: {
        ...state.cost_tracking,
        openai_tokens: state.cost_tracking.openai_tokens + output.tokens_used,
        openai_cost_usd: state.cost_tracking.openai_cost_usd + (output.tokens_used * 0.000001), // GPT-4o-mini pricing
      },
    }
  } catch (error) {
    logError('validator', error as Error)

    // On validation error, pass through all tasks (better to have duplicates than lose tasks)
    return {
      tasks: state.tasks,
      current_agent: 'router',
      errors: [
        ...state.errors,
        {
          agent: 'validator',
          error_type: 'VALIDATION_FAILED',
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
          recoverable: true,
        },
      ],
    }
  }
}

// ============================================================================
// Task Validation Logic
// ============================================================================

async function validateTasks(input: ValidatorInput): Promise<ValidatorOutput> {
  const validatedTasks: Task[] = []
  let totalTokens = 0
  let duplicatesFound = 0

  for (const task of input.tasks) {
    try {
      // Get existing tasks for this assignee
      const existingTasks = await supabaseGetExistingTasks(task.assignee_name)

      // Skip duplicate check if no existing tasks
      if (existingTasks.length === 0) {
        validatedTasks.push({
          ...task,
          is_duplicate: false,
          similarity_score: 0,
        })
        continue
      }

      // Check for duplicates using LLM
      const duplicateResult = await openAICheckDuplicate(task.title, existingTasks)
      totalTokens += 100 // Approximate tokens for mini model

      // Apply duplicate check result
      const validatedTask = checkDuplicateTasks(task, [], duplicateResult)
      validatedTasks.push(validatedTask)

      if (validatedTask.is_duplicate) {
        duplicatesFound++
      }
    } catch (error) {
      logError('validator', error as Error, { taskId: task.task_id })
      
      // On individual task error, mark as non-duplicate to avoid losing the task
      validatedTasks.push({
        ...task,
        is_duplicate: false,
      })
    }
  }

  return {
    validated_tasks: validatedTasks,
    duplicates_found: duplicatesFound,
    tokens_used: totalTokens,
  }
}

// ============================================================================
// Batch Validation (for performance optimization)
// ============================================================================

export async function batchValidateTasks(
  tasks: Task[],
  userId: string
): Promise<Task[]> {
  // Group tasks by assignee for efficient duplicate checking
  const tasksByAssignee = new Map<string, Task[]>()

  for (const task of tasks) {
    const existing = tasksByAssignee.get(task.assignee_name) || []
    existing.push(task)
    tasksByAssignee.set(task.assignee_name, existing)
  }

  const validatedTasks: Task[] = []

  // Process each assignee's tasks
  const entries = Array.from(tasksByAssignee.entries())
  for (const [assigneeName, assigneeTasks] of entries) {
    try {
      // Get existing tasks once per assignee
      const existingTasks = await supabaseGetExistingTasks(assigneeName)

      // Validate each task
      for (const task of assigneeTasks) {
        if (existingTasks.length === 0) {
          validatedTasks.push({
            ...task,
            is_duplicate: false,
            similarity_score: 0,
          })
          continue
        }

        const duplicateResult = await openAICheckDuplicate(task.title, existingTasks)
        const validatedTask = checkDuplicateTasks(task, [], duplicateResult)
        validatedTasks.push(validatedTask)
      }
    } catch (error) {
      logError('validator', error as Error, { assignee: assigneeName })
      
      // On error, pass through tasks as non-duplicates
      validatedTasks.push(...assigneeTasks.map(t => ({
        ...t,
        is_duplicate: false,
      })))
    }
  }

  return validatedTasks
}

// ============================================================================
// Local Duplicate Detection (fallback without LLM)
// ============================================================================

export function localDuplicateCheck(
  newTask: Task,
  existingTasks: Array<{ task_id: string; title: string }>
): { is_duplicate: boolean; duplicate_task_id: string | null; similarity_score: number } {
  const newTitleLower = newTask.title.toLowerCase().trim()
  
  for (const existing of existingTasks) {
    const existingTitleLower = existing.title.toLowerCase().trim()
    
    // Exact match
    if (newTitleLower === existingTitleLower) {
      return {
        is_duplicate: true,
        duplicate_task_id: existing.task_id,
        similarity_score: 1.0,
      }
    }

    // Simple word overlap similarity
    const newWordsArr = newTitleLower.split(/\s+/)
    const existingWordsArr = existingTitleLower.split(/\s+/)
    const newWords = new Set(newWordsArr)
    const existingWords = new Set(existingWordsArr)
    
    const intersection = newWordsArr.filter(w => existingWords.has(w))
    const unionArr = Array.from(new Set([...newWordsArr, ...existingWordsArr]))
    
    const similarity = intersection.length / unionArr.length

    if (similarity >= 0.85) {
      return {
        is_duplicate: true,
        duplicate_task_id: existing.task_id,
        similarity_score: similarity,
      }
    }
  }

  return {
    is_duplicate: false,
    duplicate_task_id: null,
    similarity_score: 0,
  }
}
