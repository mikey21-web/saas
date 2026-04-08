import { NextRequest, NextResponse } from 'next/server'

/**
 * Evolution API webhook — inbound WhatsApp messages
 * POST /api/webhooks/evolution
 */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      event: string
      instance: string
      data?: {
        key?: { remoteJid?: string; id?: string }
        message?: { conversation?: string }
        pushName?: string
      }
    }

    if (payload.event !== 'messages.upsert') {
      return NextResponse.json({ ok: true })
    }

    const agentId = payload.instance
    const from = payload.data?.key?.remoteJid?.replace('@s.whatsapp.net', '') ?? ''
    const messageText = payload.data?.message?.conversation ?? ''

    if (!from || !messageText) {
      return NextResponse.json({ ok: true })
    }

    // TODO: Phase 8 — queue LangGraph job here
    // await queueAgentJob({ agentId, channel: 'whatsapp', from, message: messageText })

    console.log(`[WhatsApp] Agent ${agentId} received from ${from}: ${messageText}`)

    return NextResponse.json({ ok: true, agentId, from })
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
