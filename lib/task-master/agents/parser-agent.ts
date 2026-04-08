/**
 * Task Master v2 - Parser Agent
 * Extracts tasks from various input sources (audio, text, Google Docs, Notion, Calendar)
 */

import {
  Task,
  ParserInput,
  ParserOutput,
  WorkflowState,
  InputType,
} from '../types'
import {
  openAIExtractTasks,
  geminiExtractTasks,
} from '../integrations'
import {
  generateTaskId,
  getDefaultDeadline,
  logAgentTransition,
  logError,
} from '../utils'

// ============================================================================
// Parser Agent Node
// ============================================================================

export async function parserAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  logAgentTransition('START', 'parser', {
    inputType: state.input_type,
    meetingId: state.meeting_id,
  })

  const input: ParserInput = {
    input_text: state.input_text,
    input_type: state.input_type,
    meeting_id: state.meeting_id,
    user_id: state.user_id,
  }

  try {
    const output = await extractTasks(input)

    // Add metadata to tasks
    const tasks = output.tasks.map((task, index) => ({
      ...task,
      user_id: state.user_id,
      meeting_id: state.meeting_id,
    }))

    logAgentTransition('parser', 'validator', {
      tasksExtracted: tasks.length,
      tokensUsed: output.tokens_used,
    })

    return {
      tasks,
      current_agent: 'validator',
      cost_tracking: {
        ...state.cost_tracking,
        openai_tokens: state.cost_tracking.openai_tokens + output.tokens_used,
        openai_cost_usd: state.cost_tracking.openai_cost_usd + (output.tokens_used * 0.00002), // approximate
      },
    }
  } catch (error) {
    logError('parser', error as Error)

    return {
      tasks: [],
      current_agent: 'validator',
      errors: [
        ...state.errors,
        {
          agent: 'parser',
          error_type: 'EXTRACTION_FAILED',
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
          recoverable: false,
        },
      ],
    }
  }
}

// ============================================================================
// Task Extraction Logic
// ============================================================================

async function extractTasks(input: ParserInput): Promise<ParserOutput> {
  // Preprocess input based on type
  const processedText = await preprocessInput(input.input_text, input.input_type)

  // Try OpenAI first
  try {
    const result = await openAIExtractTasks(processedText)
    const tasks = transformExtractedTasks(result.tasks, input.meeting_id)
    
    return {
      tasks,
      raw_extraction: JSON.stringify(result.tasks),
      tokens_used: result.tokensUsed,
    }
  } catch (openAIError) {
    logError('parser', openAIError as Error, { fallback: 'gemini' })

    // Fallback to Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await geminiExtractTasks(processedText)
        const tasks = transformExtractedTasks(result.tasks, input.meeting_id)
        
        return {
          tasks,
          raw_extraction: JSON.stringify(result.tasks),
          tokens_used: result.tokensUsed,
        }
      } catch (geminiError) {
        logError('parser', geminiError as Error, { fallback: 'none' })
        throw new Error('Both OpenAI and Gemini failed to extract tasks')
      }
    }

    throw openAIError
  }
}

// ============================================================================
// Input Preprocessing
// ============================================================================

async function preprocessInput(text: string, inputType: InputType): Promise<string> {
  switch (inputType) {
    case 'audio':
      // Audio should already be transcribed before reaching here
      // If not, we'd call OpenAI Whisper API
      return text

    case 'google_calendar':
      // Extract meeting description/agenda
      return extractCalendarNotes(text)

    case 'notion':
      // Extract text content from Notion blocks
      return extractNotionContent(text)

    case 'google_docs':
      // Extract text from Google Docs content
      return extractGoogleDocsContent(text)

    case 'text':
    default:
      return text
  }
}

function extractCalendarNotes(rawContent: string): string {
  try {
    const parsed = JSON.parse(rawContent)
    const description = parsed.description || ''
    const summary = parsed.summary || ''
    const attendees = parsed.attendees?.map((a: { email: string }) => a.email).join(', ') || ''

    return `Meeting: ${summary}\nAttendees: ${attendees}\n\nNotes:\n${description}`
  } catch {
    return rawContent
  }
}

function extractNotionContent(rawContent: string): string {
  try {
    const parsed = JSON.parse(rawContent)
    
    // Handle Notion page response format
    if (parsed.properties) {
      const blocks: string[] = []
      
      for (const [key, value] of Object.entries(parsed.properties)) {
        const prop = value as Record<string, unknown>
        if (prop.rich_text) {
          const richText = prop.rich_text as Array<{ plain_text: string }>
          blocks.push(`${key}: ${richText.map(t => t.plain_text).join('')}`)
        } else if (prop.title) {
          const title = prop.title as Array<{ plain_text: string }>
          blocks.push(`${key}: ${title.map(t => t.plain_text).join('')}`)
        }
      }
      
      return blocks.join('\n')
    }

    // Handle block children response
    if (parsed.results) {
      return parsed.results
        .map((block: Record<string, unknown>) => {
          const type = block.type as string
          const content = block[type] as Record<string, unknown>
          if (content?.rich_text) {
            const richText = content.rich_text as Array<{ plain_text: string }>
            return richText.map(t => t.plain_text).join('')
          }
          return ''
        })
        .filter(Boolean)
        .join('\n')
    }

    return rawContent
  } catch {
    return rawContent
  }
}

function extractGoogleDocsContent(rawContent: string): string {
  try {
    const parsed = JSON.parse(rawContent)
    
    // Extract text from Google Docs body
    if (parsed.body?.content) {
      return parsed.body.content
        .map((element: Record<string, unknown>) => {
          if (element.paragraph) {
            const paragraph = element.paragraph as { elements?: Array<{ textRun?: { content: string } }> }
            return paragraph.elements
              ?.map(e => e.textRun?.content || '')
              .join('')
          }
          return ''
        })
        .filter(Boolean)
        .join('\n')
    }

    return rawContent
  } catch {
    return rawContent
  }
}

// ============================================================================
// Task Transformation
// ============================================================================

interface RawExtractedTask {
  title: string
  assignee_name: string
  deadline?: string
  priority?: 'high' | 'medium' | 'low'
  dependencies?: string[]
  subtasks?: string[]
  is_recurring?: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly'
}

function transformExtractedTasks(
  rawTasks: RawExtractedTask[],
  meetingId: string
): Task[] {
  const now = new Date().toISOString()

  return rawTasks.map((raw, index) => ({
    // Required fields
    task_id: generateTaskId(index),
    title: raw.title,
    assignee_name: raw.assignee_name,
    deadline: raw.deadline || getDefaultDeadline(),
    priority: raw.priority || 'medium',
    dependencies: raw.dependencies || [],
    subtasks: raw.subtasks || [],
    is_recurring: raw.is_recurring || false,
    recurrence_pattern: raw.recurrence_pattern,
    
    // Status fields
    status: 'pending' as const,
    completion_percent: 0,
    
    // Contact fields (to be filled by Router)
    assignee_phone: undefined,
    assignee_email: undefined,
    assignee_whatsapp_id: undefined,
    contact_found: false,
    
    // Notification fields
    whatsapp_sent: false,
    whatsapp_message_id: undefined,
    notified_at: undefined,
    
    // Validation fields
    is_duplicate: false,
    duplicate_task_id: undefined,
    similarity_score: undefined,
    
    // Metadata
    meeting_id: meetingId,
    created_at: now,
    completed_at: undefined,
    reminder_24h_sent: false,
    reminder_2h_sent: false,
    extension_granted: false,
    retry_count: 0,
    parent_task_id: undefined,
  }))
}

// ============================================================================
// Audio Transcription (if needed)
// ============================================================================

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const { getOpenAIClient } = await import('../integrations')
  const client = getOpenAIClient()

  // Create blob using type assertion for Node.js Buffer compatibility
  const blobParts: BlobPart[] = [audioBuffer as unknown as BlobPart]
  const blob = new Blob(blobParts, { type: 'audio/mp3' })
  const file = new File([blob], 'audio.mp3', { type: 'audio/mp3' })

  const transcription = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  })

  return transcription.text
}
