import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Resend webhook — bounce + complaint events
 * POST /api/webhooks/resend
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature =
      request.headers.get('resend-signature') || request.headers.get('x-resend-signature') || ''
    const secret = process.env.RESEND_WEBHOOK_SECRET || ''

    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    if (
      expectedSignature.length !== signature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      )
    ) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody) as {
      type: string
      data?: {
        email_id?: string
        to?: string[]
        tags?: Record<string, string>
      }
    }

    switch (event.type) {
      case 'email.bounced':
        console.warn(`[Resend] Email bounced for ${event.data?.to?.[0]}`)
        // TODO: increment bounce count in Supabase, pause agent email if > 5%
        break

      case 'email.complained':
        console.error(`[Resend] Spam complaint from ${event.data?.to?.[0]}`)
        // TODO: suspend agent email, notify user, add to suppression list
        break

      case 'email.delivered':
        // TODO: update delivery status in Supabase
        break
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    console.error('Resend webhook error:', e)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
