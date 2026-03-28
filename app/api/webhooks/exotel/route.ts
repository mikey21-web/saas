import { NextRequest, NextResponse } from 'next/server'

/**
 * Exotel webhook — inbound SMS and call events
 * POST /api/webhooks/exotel
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

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
