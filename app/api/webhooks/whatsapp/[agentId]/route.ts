/**
 * WhatsApp Webhook Handler — POST /api/webhooks/whatsapp/[agentId]
 *
 * Receives incoming WhatsApp messages from Exotel or Meta API
 * Authenticates using stored auth token
 * Executes agent via LangGraph
 * Sends response back to customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCredentialsByAuthToken } from '@/lib/supabase/credentials'
import { executeAgent } from '@/lib/agent/executor'
import type { ExecutionTrigger } from '@/lib/agent/executor'

export const runtime = 'nodejs'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WhatsAppMessage {
  from: string // Phone number with country code (e.g., +919876543210)
  type: 'text' | 'image' | 'document' | 'audio'
  text?: string
  timestamp: number
  messageId: string
}

interface WebhookPayload {
  entry: Array<{
    changes: Array<{
      value: {
        messages: WhatsAppMessage[]
        contacts: Array<{ profile: { name: string }; wa_id: string }>
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
      }
    }>
  }>
}

// ─── GET — Webhook Verification ─────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  // Meta/WhatsApp webhook verification
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && challenge) {
    const { agentId: resolvedAgentId } = await params
    const authToken = token

    const { valid, userId } = await getCredentialsByAuthToken(resolvedAgentId, authToken || '')

    if (valid && userId) {
      return new NextResponse(challenge, { status: 200 })
    }

    return new NextResponse('Forbidden', { status: 403 })
  }

  return new NextResponse('Bad Request', { status: 400 })
}

// ─── POST — Handle Incoming Messages ─────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  // start

  try {
    // console.log(`[WEBHOOK] Received message for agent: ${agentId}`)

    // Signature stored for future HMAC verification
    // const signature = request.headers.get('X-Hub-Signature-256') || ''

    // Parse webhook payload
    const payload = (await request.json()) as WebhookPayload

    if (!payload.entry?.[0]?.changes?.[0]?.value?.messages) {
      // console.warn('[WEBHOOK] Invalid payload structure')
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const messageData = payload.entry[0].changes[0].value
    const messages = messageData.messages || []
    const contacts = messageData.contacts || []
    const displayPhoneNumber = messageData.metadata?.display_phone_number

    // Process each message
    for (const message of messages) {
      try {
        await processMessage(agentId, message, contacts[0], displayPhoneNumber)
      } catch (_) {
        // console.error(`[WEBHOOK] Error processing message ${message.messageId}:`, err)
        // Continue processing other messages
      }
    }

    // completed

    // Always return 200 to acknowledge receipt (Meta requires it)
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── Message Processing ─────────────────────────────────────────────────────

async function processMessage(
  agentId: string,
  message: WhatsAppMessage,
  contact: { profile: { name: string }; wa_id: string },
  displayPhoneNumber: string
) {
  // Only process text messages
  if (message.type !== 'text' || !message.text) {
    // console.log(`[MSG] Skipping non-text message: ${message.type}`)
    return
  }

  const senderPhone = message.from
  const senderName = contact?.profile?.name || senderPhone

  // console.log(`[MSG] From: ${senderName} (${senderPhone}) → "${message.text.substring(0, 50)}"`)

  // Create execution trigger
  const trigger: ExecutionTrigger = {
    agentId,
    userId: '', // Will be fetched from credentials
    message: message.text,
    channel: 'whatsapp',
    conversationId: `wa_${agentId}_${senderPhone}_${Date.now()}`,
    senderName,
    metadata: {
      whatsappMessageId: message.messageId,
      timestamp: message.timestamp,
      senderPhone,
    },
  }

  // Note: In production, we need to fetch userId from agent_credentials
  // For now, this is a placeholder
  // TODO: Update after database schema is created
  // const credentials = await getAgentCredentials(userId, agentId)
  // if (!credentials) {
  //   // console.error(`[MSG] Credentials not found for agent: ${agentId}`)
  //   return
  // }

  // Execute agent
  const result = await executeAgent(trigger)

  if (!result.success) {
    // console.warn(`[MSG] Execution failed: ${result.error}`)
    // Still try to send a message to user
    await sendWhatsAppMessage(
      senderPhone,
      displayPhoneNumber,
      "I'm having trouble processing your request right now. Please try again.",
      agentId
    )
    return
  }

  // Send response back via WhatsApp
  await sendWhatsAppMessage(senderPhone, displayPhoneNumber, result.response, agentId)

  // Log conversation
  await logConversation(agentId, senderPhone, senderName, message.text, result.response)
}

// ─── Send WhatsApp Message ──────────────────────────────────────────────────

async function sendWhatsAppMessage(
  recipientPhone: string,
  senderPhone: string,
  messageText: string,
  _agentId: string
): Promise<boolean> {
  try {
    // Determine which API to use (Exotel for India, Meta official for others)
    const isIndia = recipientPhone.startsWith('+91')

    if (isIndia && process.env.EXOTEL_API_URL) {
      return await sendViaExotel(recipientPhone, senderPhone, messageText)
    } else if (process.env.META_WHATSAPP_API_URL) {
      return await sendViaMetaAPI(recipientPhone, messageText)
    }

    // console.warn('[SEND] No WhatsApp API configured')
    return false
  } catch (_) {
    // console.error('[SEND] Failed to send WhatsApp message:', err)
    return false
  }
}

async function sendViaExotel(
  recipientPhone: string,
  senderPhone: string,
  messageText: string
): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.EXOTEL_API_URL}/v2/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EXOTEL_API_TOKEN}`,
      },
      body: JSON.stringify({
        to: recipientPhone,
        from: senderPhone,
        body: messageText,
        channel: 'whatsapp',
      }),
    })

    if (res.ok) {
      // console.log(`[SEND] Sent to ${recipientPhone} via Exotel`)
      return true
    }

    // console.warn(`[SEND] Exotel error: ${res.statusText}`)
    return false
  } catch (_) {
    // console.error('[SEND] Exotel error:', err)
    return false
  }
}

async function sendViaMetaAPI(recipientPhone: string, messageText: string): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.META_WHATSAPP_API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'text',
        text: { body: messageText },
      }),
    })

    if (res.ok) {
      // console.log(`[SEND] Sent to ${recipientPhone} via Meta API`)
      return true
    }

    // console.warn(`[SEND] Meta API error: ${res.statusText}`)
    return false
  } catch (_) {
    // console.error('[SEND] Meta API error:', err)
    return false
  }
}

// ─── Conversation Logging ───────────────────────────────────────────────────

async function logConversation(
  agentId: string,
  senderPhone: string,
  senderName: string,
  userMessage: string,
  agentResponse: string
): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabase/client')

    await (supabase.from('conversations') as any).insert({
      agent_id: agentId,
      sender_phone: senderPhone,
      sender_name: senderName,
      user_message: userMessage,
      agent_response: agentResponse,
      channel: 'whatsapp',
      created_at: new Date().toISOString(),
    })
  } catch (_) {
    // console.error('[LOG] Failed to log conversation:', err)
    // Don't throw - logging failure shouldn't block the flow
  }
}
