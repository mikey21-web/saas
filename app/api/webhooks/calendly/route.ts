import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { lookupLeadContext, recordWebhookEvent } from '@/lib/ai-sdr/integrations'
import { queueAiSdrJob } from '@/lib/ai-sdr/queue'
import { CalendlyEventPayload } from '@/lib/ai-sdr/types'

export const runtime = 'nodejs'

interface CalendlyWebhookBody {
  agentId?: string
  userId?: string
  event: CalendlyEventPayload
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    validateCalendlySignature(req, rawBody, process.env.CALENDLY_WEBHOOK_SECRET || '')

    const body = JSON.parse(rawBody) as CalendlyWebhookBody
    if (!body.event?.event_id || !body.event?.lead_id || !body.event?.scheduled_at) {
      return NextResponse.json({ error: 'Missing required Calendly event fields' }, { status: 400 })
    }

    const context = await lookupLeadContext(body.event.lead_id)
    const userId = body.userId ?? context?.user_id
    const agentId = body.agentId ?? context?.agent_id ?? 'ai_sdr'

    if (!userId) {
      return NextResponse.json({ error: 'Unable to resolve workflow context for lead' }, { status: 400 })
    }

    const recorded = await recordWebhookEvent({
      source: 'calendly',
      external_event_id: body.event.event_id,
      user_id: userId,
      agent_id: agentId,
      payload: { event: body.event },
    })

    if (!recorded.accepted) {
      return NextResponse.json({ success: true, duplicate: true })
    }

    const workflow = {
      agent_id: agentId,
      user_id: userId,
      entry_point: 'scheduler' as const,
      trigger_payload: { calendly_event: body.event },
    }

    const { jobId } = await queueAiSdrJob(workflow, 'calendly_webhook', {
      jobId: `calendly-${body.event.event_id}`,
    })

    return NextResponse.json({ success: true, queued: true, jobId })
  } catch (error) {
    console.error('Calendly webhook error:', error)
    return NextResponse.json({ error: `Webhook failed: ${String(error)}` }, { status: 500 })
  }
}

function validateCalendlySignature(req: NextRequest, rawBody: string, secret: string): void {
  if (!secret) {
    return
  }

  const header = req.headers.get('calendly-webhook-signature') || ''
  if (!header) {
    throw new Error('Missing Calendly signature')
  }

  const parts = Object.fromEntries(
    header.split(',').map((segment) => {
      const [key, value] = segment.split('=')
      return [key?.trim() ?? '', value?.trim() ?? '']
    }),
  )

  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) {
    throw new Error('Malformed Calendly signature')
  }

  const payload = `${timestamp}.${rawBody}`
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    throw new Error('Invalid Calendly signature')
  }
}
