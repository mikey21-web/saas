/**
 * Task Master v2 - API Integrations
 * OpenAI, WhatsApp, Supabase, and optional integrations (Jira, Slack, etc.)
 */

import OpenAI from 'openai'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  Task,
  TaskExtractionResponse,
  DuplicateCheckResponse,
  WhatsAppSendResponse,
  WhatsAppMessage,
  FailedNotification,
  TeamMember,
  ParsedReply,
  ExtensionRequest,
  DirectorySource,
} from './types'
import { logError, logCost, calculateOpenAICost, calculateWhatsAppCost } from './utils'

// ============================================================================
// Client Initialization
// ============================================================================

let openaiClient: OpenAI | null = null
let supabaseClient: SupabaseClient | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY environment variable is not set')
    }
    supabaseClient = createClient(url, key)
  }
  return supabaseClient
}

// ============================================================================
// OpenAI Integrations
// ============================================================================

const TASK_EXTRACTION_PROMPT = `You are a task extraction AI. Extract all action items from the meeting notes.
For each task return:
- title: Clear action item description
- assignee_name: Person responsible (as mentioned in notes)
- deadline: ISO 8601 format (default to tomorrow 5PM IST if not mentioned)
- priority: high/medium/low (infer from urgency language)
- dependencies: list of task titles this depends on
- subtasks: list of smaller tasks within this task
- is_recurring: boolean
- recurrence_pattern: if recurring: daily/weekly/monthly

Return ONLY valid JSON: { "tasks": [...] }. No explanation.`

export async function openAIExtractTasks(
  meetingText: string
): Promise<{ tasks: TaskExtractionResponse['tasks']; tokensUsed: number }> {
  const client = getOpenAIClient()

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TASK_EXTRACTION_PROMPT },
        { role: 'user', content: meetingText },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    const parsed = JSON.parse(content) as TaskExtractionResponse
    const tokensUsed = response.usage?.total_tokens ?? 0
    
    const cost = calculateOpenAICost(
      'gpt-4o',
      response.usage?.prompt_tokens ?? 0,
      response.usage?.completion_tokens ?? 0
    )
    logCost('Task extraction (GPT-4o)', cost, { tokensUsed })

    return { tasks: parsed.tasks || [], tokensUsed }
  } catch (error) {
    logError('OpenAI', error as Error, { operation: 'extractTasks' })
    throw error
  }
}

const DUPLICATE_CHECK_PROMPT = `You are a duplicate task detector.
Given a new task title and a list of existing tasks, return JSON:
{
  "is_duplicate": boolean,
  "duplicate_task_id": string | null,
  "similarity_score": number (0-1)
}
Consider semantic similarity, not just exact match. Threshold: similarity > 0.85 = duplicate.`

export async function openAICheckDuplicate(
  newTaskTitle: string,
  existingTasks: Array<{ task_id: string; title: string }>
): Promise<DuplicateCheckResponse> {
  const client = getOpenAIClient()

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: DUPLICATE_CHECK_PROMPT },
        {
          role: 'user',
          content: `New task: ${newTaskTitle}\n\nExisting tasks: ${JSON.stringify(existingTasks)}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    const cost = calculateOpenAICost(
      'gpt-4o-mini',
      response.usage?.prompt_tokens ?? 0,
      response.usage?.completion_tokens ?? 0
    )
    logCost('Duplicate check (GPT-4o-mini)', cost)

    return JSON.parse(content) as DuplicateCheckResponse
  } catch (error) {
    logError('OpenAI', error as Error, { operation: 'checkDuplicate' })
    // Return non-duplicate on error to avoid blocking
    return { is_duplicate: false, duplicate_task_id: null, similarity_score: 0 }
  }
}

const REPLY_INTENT_PROMPT = `Parse the WhatsApp reply and return JSON:
{
  "intent": "completed" | "progress" | "extension_request" | "extension_approve" | "extension_deny" | "help" | "query" | "retry" | "unknown",
  "progress_percent": number | null,
  "extension_days": number | null,
  "task_id": string | null,
  "query_text": string | null
}
For 'retry <task_id>' messages, extract the task_id.`

export async function openAIParseReplyIntent(replyText: string): Promise<ParsedReply> {
  const client = getOpenAIClient()

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: REPLY_INTENT_PROMPT },
        { role: 'user', content: replyText },
      ],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    const cost = calculateOpenAICost(
      'gpt-4o-mini',
      response.usage?.prompt_tokens ?? 0,
      response.usage?.completion_tokens ?? 0
    )
    logCost('Reply intent parsing (GPT-4o-mini)', cost)

    return JSON.parse(content) as ParsedReply
  } catch (error) {
    logError('OpenAI', error as Error, { operation: 'parseReplyIntent' })
    return { intent: 'unknown', query_text: replyText }
  }
}

const SUMMARY_PROMPT = `Generate a concise WhatsApp-friendly evening task summary for the manager.
Use emojis. Include:
- Completed tasks ✅
- In-progress with % 🔄
- Overdue ❌
- Blocked tasks 🔒
- Unrouted tasks ⚠️
- Overall completion rate 📈
- One insight about team performance

Keep under 300 words. Format for WhatsApp readability.`

export async function openAIGenerateSummary(
  tasks: Task[],
  unroutedTasks: Task[]
): Promise<string> {
  const client = getOpenAIClient()

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SUMMARY_PROMPT },
        {
          role: 'user',
          content: `Tasks: ${JSON.stringify(tasks)}\nUnrouted: ${JSON.stringify(unroutedTasks)}`,
        },
      ],
    })

    const cost = calculateOpenAICost(
      'gpt-4o',
      response.usage?.prompt_tokens ?? 0,
      response.usage?.completion_tokens ?? 0
    )
    logCost('Summary generation (GPT-4o)', cost)

    return response.choices[0]?.message?.content ?? 'Unable to generate summary.'
  } catch (error) {
    logError('OpenAI', error as Error, { operation: 'generateSummary' })
    throw error
  }
}

// ============================================================================
// Gemini Fallback (Optional)
// ============================================================================

export async function geminiExtractTasks(
  meetingText: string
): Promise<{ tasks: TaskExtractionResponse['tasks']; tokensUsed: number }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: TASK_EXTRACTION_PROMPT + '\n\nMeeting notes:\n' + meetingText },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) {
      throw new Error('No content in Gemini response')
    }

    const parsed = JSON.parse(content) as TaskExtractionResponse
    return { tasks: parsed.tasks || [], tokensUsed: 0 }
  } catch (error) {
    logError('Gemini', error as Error, { operation: 'extractTasks' })
    throw error
  }
}

// ============================================================================
// WhatsApp Integration (Meta Business API)
// ============================================================================

export async function metaWhatsAppSend(
  message: WhatsAppMessage
): Promise<WhatsAppSendResponse> {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    throw new Error('WhatsApp credentials not configured')
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`WhatsApp API error: ${response.status} - ${errorBody}`)
    }

    const data = (await response.json()) as WhatsAppSendResponse
    
    const cost = calculateWhatsAppCost(1)
    logCost('WhatsApp message sent', cost, { to: message.to })

    return data
  } catch (error) {
    logError('WhatsApp', error as Error, { operation: 'send', to: message.to })
    throw error
  }
}

export async function sendWhatsAppNotification(
  to: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await metaWhatsAppSend({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    })

    return {
      success: true,
      messageId: response.messages?.[0]?.id,
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

// ============================================================================
// Supabase Database Operations
// ============================================================================

export async function supabaseQueryTasks(
  userId: string,
  filters?: { status?: string; assignee_name?: string }
): Promise<Task[]> {
  const client = getSupabaseClient()

  let query = client.from('tasks').select('*').eq('user_id', userId)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.assignee_name) {
    query = query.eq('assignee_name', filters.assignee_name)
  }

  const { data, error } = await query

  if (error) {
    logError('Supabase', error, { operation: 'queryTasks' })
    throw error
  }

  return (data as Task[]) || []
}

export async function supabaseGetExistingTasks(
  assigneeName: string
): Promise<Array<{ task_id: string; title: string }>> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('tasks')
    .select('task_id, title')
    .eq('assignee_name', assigneeName)
    .neq('status', 'completed')

  if (error) {
    logError('Supabase', error, { operation: 'getExistingTasks' })
    return []
  }

  return data || []
}

export async function supabaseSaveTask(task: Task): Promise<Task> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('tasks')
    .insert(task)
    .select()
    .single()

  if (error) {
    logError('Supabase', error, { operation: 'saveTask', taskId: task.task_id })
    throw error
  }

  return data as Task
}

export async function supabaseUpdateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<Task> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('tasks')
    .update(updates)
    .eq('task_id', taskId)
    .select()
    .single()

  if (error) {
    logError('Supabase', error, { operation: 'updateTask', taskId })
    throw error
  }

  return data as Task
}

export async function supabaseSaveUnroutedTask(task: Task): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client.from('unrouted_tasks').insert({
    task_id: task.task_id,
    title: task.title,
    assignee_name: task.assignee_name,
    reason: 'contact_not_found',
    created_at: new Date().toISOString(),
  })

  if (error) {
    logError('Supabase', error, { operation: 'saveUnroutedTask', taskId: task.task_id })
    throw error
  }
}

export async function supabaseQueueFailedNotification(
  notification: Omit<FailedNotification, 'id' | 'created_at'>
): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client.from('failed_notifications').insert({
    ...notification,
    created_at: new Date().toISOString(),
  })

  if (error) {
    logError('Supabase', error, { operation: 'queueFailedNotification' })
    throw error
  }
}

export async function supabaseGetFailedNotifications(): Promise<FailedNotification[]> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('failed_notifications')
    .select('*')
    .lte('next_retry_at', new Date().toISOString())
    .lt('retry_count', 5)

  if (error) {
    logError('Supabase', error, { operation: 'getFailedNotifications' })
    return []
  }

  return (data as FailedNotification[]) || []
}

export async function supabaseDeleteFailedNotification(taskId: string): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client
    .from('failed_notifications')
    .delete()
    .eq('task_id', taskId)

  if (error) {
    logError('Supabase', error, { operation: 'deleteFailedNotification', taskId })
  }
}

export async function supabaseIncrementRetryCount(taskId: string): Promise<void> {
  const client = getSupabaseClient()

  const nextRetryAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  const { error } = await client.rpc('increment_retry_count', {
    p_task_id: taskId,
    p_next_retry_at: nextRetryAt,
  })

  // Fallback if RPC doesn't exist
  if (error) {
    await client
      .from('failed_notifications')
      .update({
        retry_count: client.rpc('retry_count + 1'),
        next_retry_at: nextRetryAt,
      })
      .eq('task_id', taskId)
  }
}

// ============================================================================
// Contact Directory Lookups
// ============================================================================

export async function lookupContactSupabase(
  assigneeName: string
): Promise<TeamMember | null> {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('team_members')
    .select('*')
    .ilike('name', `%${assigneeName}%`)
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data as TeamMember
}

export async function lookupContactNotion(
  assigneeName: string
): Promise<TeamMember | null> {
  const token = process.env.NOTION_TOKEN
  const dbId = process.env.NOTION_TEAM_DB_ID

  if (!token || !dbId) {
    return null
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${dbId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: 'Name',
            rich_text: { contains: assigneeName },
          },
        }),
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const result = data.results?.[0]

    if (!result?.properties) {
      return null
    }

    return {
      id: result.id,
      name: result.properties.Name?.title?.[0]?.plain_text ?? assigneeName,
      phone: result.properties.Phone?.phone_number,
      email: result.properties.Email?.email,
      whatsapp_id: result.properties.Phone?.phone_number,
    }
  } catch {
    return null
  }
}

export async function lookupContactAirtable(
  assigneeName: string
): Promise<TeamMember | null> {
  const apiKey = process.env.AIRTABLE_API_KEY
  const baseId = process.env.AIRTABLE_BASE_ID

  if (!apiKey || !baseId) {
    return null
  }

  try {
    const formula = encodeURIComponent(`SEARCH('${assigneeName}',{Name})`)
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Team?filterByFormula=${formula}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const record = data.records?.[0]

    if (!record?.fields) {
      return null
    }

    return {
      id: record.id,
      name: record.fields.Name ?? assigneeName,
      phone: record.fields.Phone,
      email: record.fields.Email,
      whatsapp_id: record.fields.Phone,
    }
  } catch {
    return null
  }
}

export async function lookupContact(
  assigneeName: string,
  source: DirectorySource
): Promise<TeamMember | null> {
  switch (source) {
    case 'supabase':
      return lookupContactSupabase(assigneeName)
    case 'notion':
      return lookupContactNotion(assigneeName)
    case 'airtable':
      return lookupContactAirtable(assigneeName)
    case 'google_sheets':
      // Google Sheets requires OAuth, implement if needed
      return null
    default:
      return lookupContactSupabase(assigneeName)
  }
}

// ============================================================================
// Retry Logic
// ============================================================================

export async function retryFailedNotifications(): Promise<{
  succeeded: number
  failed: number
}> {
  const notifications = await supabaseGetFailedNotifications()
  let succeeded = 0
  let failed = 0

  for (const notification of notifications) {
    const result = await sendWhatsAppNotification(
      notification.assignee_whatsapp_id,
      notification.message
    )

    if (result.success) {
      await supabaseDeleteFailedNotification(notification.task_id)
      succeeded++
    } else {
      await supabaseIncrementRetryCount(notification.task_id)
      failed++
    }
  }

  return { succeeded, failed }
}

// ============================================================================
// Extension Requests
// ============================================================================

export async function supabaseSaveExtensionRequest(
  request: Omit<ExtensionRequest, 'id'>
): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client.from('extension_requests').insert(request)

  if (error) {
    logError('Supabase', error, { operation: 'saveExtensionRequest' })
    throw error
  }
}

export async function supabaseUpdateExtensionRequest(
  taskId: string,
  status: 'approved' | 'denied'
): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client
    .from('extension_requests')
    .update({
      status,
      resolved_at: new Date().toISOString(),
    })
    .eq('task_id', taskId)
    .eq('status', 'pending')

  if (error) {
    logError('Supabase', error, { operation: 'updateExtensionRequest' })
  }
}

// ============================================================================
// Optional Integrations
// ============================================================================

export async function createJiraTicket(task: Task): Promise<string | null> {
  const projectKey = process.env.JIRA_PROJECT_KEY
  const apiToken = process.env.JIRA_API_TOKEN

  if (!projectKey || !apiToken) {
    return null
  }

  // Jira implementation would go here
  // Return ticket ID on success
  console.log('[TaskMaster] Jira integration not fully implemented', { task: task.title })
  return null
}

export async function sendSlackNotification(task: Task): Promise<boolean> {
  const botToken = process.env.SLACK_BOT_TOKEN
  const channelId = process.env.SLACK_CHANNEL_ID

  if (!botToken || !channelId) {
    return false
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        text: `🆕 New Task Assigned\n*${task.title}*\nAssignee: ${task.assignee_name}\nDeadline: ${task.deadline}\nPriority: ${task.priority}`,
      }),
    })

    return response.ok
  } catch {
    return false
  }
}
