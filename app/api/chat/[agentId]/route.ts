import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveAuthIdentity } from '@/lib/auth/server'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const identity = await resolveAuthIdentity(req)
  if (!identity) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages } = (await req.json()) as {
    messages: ChatMessage[]
  }

  const apiKey = process.env.GROQ_API_KEY!

  try {
    const systemPrompt = `You are an AI agent working for a business. You are helpful, professional, and concise.

You have access to these capabilities:
- Send WhatsApp messages to customers
- Send emails professionally
- Check and update task status
- Generate reports and summaries

Always respond professionally and concisely. Use the user's language (English/Hindi/Hinglish).

When you need to take action, respond with a JSON object indicating the action:
{"action": "send_whatsapp", "to": "phone number", "message": "content"}
{"action": "send_email", "to": "email@example.com", "subject": "subject", "message": "content"}
{"action": "create_task", "title": "task title", "assignee": "person name"}
{"action": "generate_report", "type": "daily_summary|sales|performance"}

For regular responses, just reply normally in text.`

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Groq API error: ${error}`)
    }

    const data = await response.json()
    const assistantMessage =
      data.choices[0]?.message?.content ||
      'I apologize, but I could not generate a response. Please try again.'

    // Save conversation to database
    const allMessages = [
      ...messages,
      { role: 'assistant', content: assistantMessage, timestamp: new Date().toISOString() },
    ]

    try {
      await supabase.from('agent_conversations').insert({
        agent_id: agentId,
        user_id: identity.supabaseUserId,
        messages: allMessages,
        created_at: new Date().toISOString(),
      })
    } catch (dbError) {
      console.log('Database insert failed (table may not exist):', dbError)
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process message',
        message: 'I apologize, but something went wrong. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params
  const identity = await resolveAuthIdentity(req)
  if (!identity) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { data, error } = await supabase
      .from('agent_conversations')
      .select('messages, created_at')
      .eq('agent_id', agentId)
      .eq('user_id', identity.supabaseUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return new Response(JSON.stringify({ messages: [] }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        messages: data.messages || [],
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Get conversation error:', error)
    return new Response(JSON.stringify({ messages: [] }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
