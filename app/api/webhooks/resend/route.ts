import { NextRequest, NextResponse } from 'next/server'

/**
 * Resend webhook — bounce + complaint events
 * POST /api/webhooks/resend
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json() as {
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
