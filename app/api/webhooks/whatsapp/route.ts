import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export const runtime = 'nodejs'

/**
 * WhatsApp webhook for receiving incoming messages from Meta's WhatsApp Business API
 *
 * Handles:
 * - Incoming messages from customers
 * - Delivery/read confirmations
 * - Status updates
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Log the incoming webhook for debugging
    // console.('WhatsApp webhook received:', JSON.stringify(body, null, 2))

    // Meta's webhook structure
    const { entry } = body
    if (!entry || !Array.isArray(entry) || entry.length === 0) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const webhookEvent = entry[0]
    const changes = webhookEvent.changes?.[0]
    if (!changes) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const { value } = changes
    const messages = value.messages || []
    const statuses = value.statuses || []

    // Process incoming messages
    for (const message of messages) {
      await handleIncomingMessage(message, value)
    }

    // Process status updates (delivery, read, etc.)
    for (const status of statuses) {
      await handleStatusUpdate(status, value)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (_) {
    // console.('WhatsApp webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Webhook verification endpoint (Meta requires this)
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  if (!verifyToken) {
    return NextResponse.json({ error: 'Webhook verify token not configured' }, { status: 500 })
  }

  if (mode === 'subscribe' && token === verifyToken) {
    // console.('WhatsApp webhook verified')
    return new Response(challenge || '', { status: 200 })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}

/**
 * Handle incoming message from WhatsApp
 */
async function handleIncomingMessage(message: Record<string, any>, metadata: Record<string, any>) {
  try {
    const {
      from, // Customer's WhatsApp number (without +)
      id: messageId,
      type,
      text,
      image,
      document,
    } = message

    const {
      phone_number_id, // The business phone number ID
    } = metadata

    // Extract message content based on type
    let messageContent = ''
    if (type === 'text' && text?.body) {
      messageContent = text.body
    } else if (type === 'image' && image?.caption) {
      messageContent = `[Image] ${image.caption}`
    } else if (type === 'document' && document?.caption) {
      messageContent = `[Document] ${document.caption}`
    } else {
      messageContent = `[${type}] Message received`
    }

    // Find agent by WhatsApp phone number ID
    const { data: agent } = await (supabaseAdmin.from('agents') as any)
      .select('*')
      .eq('whatsapp_phone_number_id', phone_number_id)
      .single()

    if (!agent) {
      // console.(`No agent found for phone_number_id: ${phone_number_id}`)
      return
    }

    // Find or create conversation
    const customerPhoneWithCountry = `+${from}`
    let { data: conversation } = await (supabaseAdmin.from('conversations') as any)
      .select('*')
      .eq('agent_id', agent.id)
      .eq('contact_phone_or_email', customerPhoneWithCountry)
      .eq('channel', 'whatsapp')
      .single()

    if (!conversation) {
      const { data: newConversation } = await (supabaseAdmin.from('conversations') as any)
        .insert({
          user_id: agent.user_id,
          agent_id: agent.id,
          contact_phone_or_email: customerPhoneWithCountry,
          channel: 'whatsapp',
          status: 'active',
          total_messages: 1,
        })
        .select()
        .single()

      conversation = newConversation
    } else {
      // Update message count
      await (supabaseAdmin.from('conversations') as any)
        .update({
          total_messages: (conversation.total_messages || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id)
    }

    // Store incoming message
    await (supabaseAdmin.from('messages') as any).insert({
      conversation_id: conversation.id,
      agent_id: agent.id,
      role: 'user',
      content: messageContent,
      channel: 'whatsapp',
      external_message_id: messageId,
    })

    // Mark message as read
    await markMessageAsRead(phone_number_id, messageId)

    // Queue agent response
    await queueAgentResponse(
      agent.id,
      conversation.id,
      customerPhoneWithCountry,
      messageContent,
      phone_number_id
    )
  } catch (_) {
    // console.('Error handling incoming message:', error)
  }
}

/**
 * Handle status updates (delivery, read)
 */
async function handleStatusUpdate(status: Record<string, any>, _metadata: unknown) {
  try {
    const { id: _messageId, status: _deliveryStatus } = status

    // console.(`Message ${messageId} status: ${deliveryStatus}`)
    // Store status update if needed (for analytics)
  } catch (_) {
    // console.('Error handling status update:', error)
  }
}

/**
 * Mark message as read in WhatsApp
 */
async function markMessageAsRead(phoneNumberId: string, messageId: string) {
  try {
    const response = await fetch(`https://graph.instagram.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_BUSINESS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    })

    if (!response.ok) {
      // console.('Failed to mark message as read:', await response.text())
    }
  } catch (_) {
    // console.('Error marking message as read:', error)
  }
}

/**
 * Queue agent response via BullMQ
 * This will be picked up by a worker to generate and send the response
 */
async function queueAgentResponse(
  agentId: string,
  conversationId: string,
  customerPhone: string,
  userMessage: string,
  phoneNumberId: string
) {
  try {
    // TODO: Integrate with BullMQ to queue job
    // For now, we'll just call the agent executor directly
    await executeAgentResponse(agentId, conversationId, customerPhone, userMessage, phoneNumberId)
  } catch (_) {
    // console.('Error queueing agent response:', error)
  }
}

/**
 * Execute agent and send response
 */
async function executeAgentResponse(
  agentId: string,
  conversationId: string,
  customerPhone: string,
  userMessage: string,
  phoneNumberId: string
) {
  try {
    // Fetch agent config
    const { data: agent } = await (supabaseAdmin.from('agents') as any)
      .select('*')
      .eq('id', agentId)
      .single()

    if (!agent) return

    // Get conversation history for context
    const { data: messages } = await (supabaseAdmin.from('messages') as any)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10)

    // Build context for LLM
    const conversationHistory =
      messages?.map((m: Record<string, any>) => ({
        role: m.role,
        content: m.content,
      })) || []

    // Get knowledge base for RAG
    const { data: knowledge } = await (supabaseAdmin.from('knowledge_documents') as any)
      .select('content')
      .eq('agent_id', agentId)
      .limit(5)

    const knowledgeContext =
      knowledge?.map((k: Record<string, any>) => k.content).join('\n\n') || ''

    // Use new agent executor if template_id maps to a known agent type
    const { executeAgent } = await import('@/lib/agents/agent-executor')
    const { AGENT_CATALOG } = await import('@/lib/agents/all-prompts')
    const agentType = AGENT_CATALOG.find((a) => a.type === agent.template_id)
      ? agent.template_id
      : 'customersupport'

    const execResult = await executeAgent({
      agentId,
      agentType,
      message: userMessage,
      channel: 'whatsapp',
      fromPhone: customerPhone,
      conversationId,
    })

    if (execResult.success) {
      await sendWhatsAppMessage(phoneNumberId, customerPhone, execResult.response)
      return
    }

    // Fallback to inline LLM if executor fails
    const systemPrompt = `${agent.system_prompt || 'You are a helpful assistant.'}

${knowledgeContext ? `\n\nBusiness Knowledge:\n${knowledgeContext}` : ''}

Respond naturally, concisely, and helpfully. Keep responses under 1000 characters for WhatsApp.`

    // Call LLM (Groq/Gemini)
    const response = await callLLM(systemPrompt, conversationHistory, userMessage, agent)

    // Store agent response
    await (supabaseAdmin.from('messages') as any).insert({
      conversation_id: conversationId,
      agent_id: agentId,
      role: 'agent',
      content: response,
      channel: 'whatsapp',
    })

    // Send response via WhatsApp API
    await sendWhatsAppMessage(phoneNumberId, customerPhone, response)

    // Update conversation total_messages
    await (supabaseAdmin.from('conversations') as any)
      .update({
        total_messages: (messages?.length || 0) + 2, // +1 for incoming, +1 for response
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  } catch (_) {
    // console.('Error executing agent response:', error)
  }
}

/**
 * Call LLM with conversation context
 */
async function callLLM(
  systemPrompt: string,
  conversationHistory: unknown[],
  newMessage: string,
  _agent: unknown
): Promise<string> {
  try {
    // Use Groq by default (free, fast)
    const messages = [
      ...conversationHistory,
      {
        role: 'user' as const,
        content: newMessage,
      },
    ]

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768', // or llama-3.1-70b-versatile
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${await response.text()}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.'
  } catch (_) {
    // console.('LLM error:', error)
    return 'I am experiencing technical difficulties. Please try again later.'
  }
}

/**
 * Send message via WhatsApp Business API
 */
async function sendWhatsAppMessage(
  phoneNumberId: string,
  recipientPhone: string,
  messageText: string
): Promise<void> {
  try {
    const response = await fetch(`https://graph.instagram.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_BUSINESS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone.replace('+', ''), // Remove + prefix if present
        type: 'text',
        text: {
          body: messageText,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      // console.(`Failed to send WhatsApp message: ${error}`)
      throw new Error(`WhatsApp API error: ${error}`)
    }

    // console.(`Message sent to ${recipientPhone}`)
  } catch (err) {
    throw err
  }
}
