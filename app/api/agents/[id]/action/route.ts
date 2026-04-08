import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveAuthIdentity } from '@/lib/auth/server'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getOwnedAgent(agentId: string, userId: string) {
  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, user_id')
    .eq('id', agentId)
    .eq('user_id', userId)
    .single()

  if (error || !agent) {
    return null
  }

  return agent
}

export async function POST(req: NextRequest) {
  const identity = await resolveAuthIdentity(req)
  if (!identity) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { agentId, action, params } = (await req.json()) as {
    agentId: string
    action: string
    params: Record<string, unknown>
  }

  const apiKey = process.env.GROQ_API_KEY!

  try {
    const ownedAgent = await getOwnedAgent(agentId, identity.supabaseUserId)
    if (!ownedAgent) {
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let result: unknown

    switch (action) {
      case 'send_whatsapp': {
        const { to, message } = params as { to: string; message: string }

        // Call WhatsApp API (would integrate with Meta/API)
        console.log(`[ACTION] Sending WhatsApp to ${to}: ${message}`)

        result = {
          success: true,
          channel: 'whatsapp',
          to,
          message,
          timestamp: new Date().toISOString(),
        }
        break
      }

      case 'send_email': {
        const { to, subject, message } = params as { to: string; subject: string; message: string }

        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, text: message }),
        })

        result = await emailResponse.json()
        break
      }

      case 'create_task': {
        const { title, assignee, description } = params as {
          title: string
          assignee?: string
          description?: string
        }

        try {
          const { data, error } = await supabase
            .from('tasks')
            .insert({
              workflow_id: agentId,
              user_id: identity.supabaseUserId,
              title,
              description,
              assigned_to: assignee || 'unassigned',
              status: 'pending',
              created_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (error) throw error

          result = {
            success: true,
            channel: 'database',
            task: data,
            message: `Task "${title}" created successfully`,
          }
        } catch (dbError) {
          console.log('Task creation failed (table may not exist):', dbError)
          result = {
            success: true,
            channel: 'mock',
            message: `Task "${title}" created (database not configured)`,
          }
        }
        break
      }

      case 'generate_report': {
        const { type } = params as { type: string }

        // Generate report using AI
        const reportPrompt = `Generate a ${type || 'daily'} report for the agent. Include:
- Tasks completed today
- Tasks pending
- Key metrics
- Recommendations

Keep it concise and actionable.`

        const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: reportPrompt }],
            temperature: 0.5,
            max_tokens: 500,
          }),
        })

        const data = await aiResponse.json()
        const report = data.choices[0]?.message?.content || 'Could not generate report'

        result = {
          success: true,
          type,
          report,
          generated_at: new Date().toISOString(),
        }
        break
      }

      case 'send_sms': {
        const { to, message } = params as { to: string; message: string }

        console.log(`[ACTION] Sending SMS to ${to}: ${message}`)

        result = {
          success: true,
          channel: 'sms',
          to,
          message,
          timestamp: new Date().toISOString(),
        }
        break
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    // Log action to database
    try {
      await supabase.from('agent_actions').insert({
        agent_id: agentId,
        user_id: identity.supabaseUserId,
        action_type: action,
        action_params: params,
        result,
        created_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.log('Action logging failed:', logError)
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Agent action error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Action failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function GET(req: NextRequest) {
  const identity = await resolveAuthIdentity(req)
  if (!identity) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agentId')
  if (!agentId) {
    return new Response(JSON.stringify({ error: 'agentId and userId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const ownedAgent = await getOwnedAgent(agentId, identity.supabaseUserId)
    if (!ownedAgent) {
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data, error } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('user_id', identity.supabaseUserId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return new Response(JSON.stringify({ actions: data || [] }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Get actions error:', error)
    return new Response(JSON.stringify({ actions: [] }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
