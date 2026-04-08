import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Exotel webhook — inbound SMS and call events
 * POST /api/webhooks/exotel
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-exotel-signature') || ''
    const secret = process.env.EXOTEL_WEBHOOK_SECRET || ''

    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    if (
      expected.length !== signature.length ||
      !crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'))
    ) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const formData = new URLSearchParams(rawBody)

    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const direction = formData.get('Direction') as string

    if (!from) return NextResponse.json({ ok: true })

    if (direction === 'inbound' && body) {
      // Inbound SMS
      console.log(`[Exotel SMS] Inbound from ${from} to ${to}: ${body}`)
      // TODO: Phase 8 — queue LangGraph job
      // await queueAgentJob({ channel: 'sms', from, message: body, agentPhone: to })
    } else if (!body) {
      // Inbound call
      console.log(`[Exotel Call] Inbound call from ${from}`)
      // Return TwiML-compatible response for IVR
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Thank you for calling. Your AI agent will be with you shortly.</Say>
        </Response>`,
        { headers: { 'Content-Type': 'application/xml' } }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    console.error('Exotel webhook error:', e)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
