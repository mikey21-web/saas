import { runTaskMasterWorkflow } from '@/lib/task-master/task-master'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface TaskMasterContext {
  agentId: string
  userId: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for TaskMaster Agent
 * 5-agent LangGraph: Parser → Validator → Router → Notifier → Tracker
 *
 * Accepts:
 * - Meeting notes text → parses into tasks → assigns to team → notifies via WhatsApp
 * - Task status updates → tracks completion
 */
export async function executeTaskMaster(
  userMessage: string,
  ctx: TaskMasterContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    const result = await runTaskMasterWorkflow({
      agent_id: ctx.agentId,
      user_id: ctx.userId,
      meeting_id: `msg_${Date.now()}`,
      input_text: userMessage,
      input_type: 'text',
      directory_source: 'supabase',
    })

    const tasksCount = result.tasks?.length || 0
    const unroutedCount = result.unrouted_tasks?.length || 0
    const errorsCount = result.errors?.length || 0

    let responseMessage = ''

    if (tasksCount > 0) {
      responseMessage = `✅ Parsed ${tasksCount} task${tasksCount > 1 ? 's' : ''} from your meeting notes.`
      if (unroutedCount > 0) responseMessage += ` (${unroutedCount} could not be assigned — team member not found)`
      if (result.summary_report) responseMessage += `\n\n${result.summary_report}`
    } else if (errorsCount > 0) {
      responseMessage = `Processed your request but encountered ${errorsCount} issue(s). ${result.errors?.[0]?.error_type || ''}`
    } else {
      responseMessage = result.summary_report || 'No tasks found in your message. Try: "Assign John to fix the login bug by Friday."'
    }

    await storeConversation(userMessage, responseMessage, ctx)

    return {
      success: true,
      message: responseMessage,
      data: {
        tasks_parsed: tasksCount,
        tasks_unrouted: unroutedCount,
        summary: result.summary_report,
        duration_ms: result.duration_ms,
        cost: result.cost_tracking?.total_cost_usd,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[TaskMaster] Execution error:', msg)
    return {
      success: false,
      message: 'TaskMaster ran into an issue. Please try again.',
      data: { error: msg },
    }
  }
}

async function storeConversation(
  userMessage: string,
  agentMessage: string,
  ctx: TaskMasterContext
): Promise<void> {
  try {
    const identifier = ctx.fromPhone || ctx.fromEmail || 'api'

    const { data: existingConv } = await (supabaseAdmin.from('conversations') as any)
      .select('id')
      .eq('agent_id', ctx.agentId)
      .eq('contact_phone_or_email', identifier)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let convId = (existingConv as any)?.id

    if (!convId) {
      const { data: newConv } = await (supabaseAdmin.from('conversations') as any)
        .insert({
          agent_id: ctx.agentId,
          user_id: ctx.userId,
          contact_phone_or_email: identifier,
          channel: ctx.channel || 'api',
          status: 'active',
        })
        .select('id')
        .single()
      convId = (newConv as any)?.id
    }

    if (convId) {
      await (supabaseAdmin.from('messages') as any).insert([
        { conversation_id: convId, agent_id: ctx.agentId, role: 'user', content: userMessage, channel: ctx.channel || 'api' },
        { conversation_id: convId, agent_id: ctx.agentId, role: 'agent', content: agentMessage, channel: ctx.channel || 'api' },
      ])
    }

    await (supabaseAdmin.from('agent_executions') as any).insert({
      agent_id: ctx.agentId,
      agent_type: 'task-master',
      input: { message: userMessage, channel: ctx.channel },
      output: { message: agentMessage },
      conversation_id: convId,
    })
  } catch (err) {
    console.error('[TaskMaster] Error storing conversation:', err)
  }
}
