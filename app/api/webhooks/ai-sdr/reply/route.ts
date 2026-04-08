import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { lookupSequenceContext, recordWebhookEvent } from '@/lib/ai-sdr/integrations'
import { queueAiSdrJob } from '@/lib/ai-sdr/queue'
import { WorkflowReplyPayload } from '@/lib/ai-sdr/types'

export const runtime = 'nodejs'

interface ReplyWebhookBody {
  agentId?: string
  userId?: string
  reply: WorkflowReplyPayload
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    validateWebhookSignature(req, rawBody, process.env.AI_SDR_WEBHOOK_SECRET || '')

    const body = JSON.parse(rawBody) as ReplyWebhookBody
    if (!body.reply?.sequence_id || !body.reply?.lead_id || !body.reply?.reply_text) {
      return NextResponse.json({ error: 'Missing required reply fields' }, { status: 400 })
    }

    const externalEventId = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        sequence_id: body.reply.sequence_id,
        lead_id: body.reply.lead_id,
        received_at: body.reply.received_at,
        reply_text: body.reply.reply_text,
      }))
      .digest('hex')

    const context = await lookupSequenceContext(body.reply.sequence_id)
    const userId = body.userId ?? context?.user_id
    const agentId = body.agentId ?? context?.agent_id ?? 'ai_sdr'

    if (!userId) {
      return NextResponse.json({ error: 'Unable to resolve workflow context for sequence' }, { status: 400 })
    }

    const recorded = await recordWebhookEvent({
      source: 'reply',
      external_event_id: externalEventId,
      user_id: userId,
      agent_id: agentId,
      payload: { reply: body.reply },
    })

    if (!recorded.accepted) {
      return NextResponse.json({ success: true, duplicate: true })
    }

    const workflow = {
      agent_id: agentId,
      user_id: userId,
      entry_point: 'qualifier' as const,
      trigger_payload: { reply: body.reply },
    }

    const { jobId } = await queueAiSdrJob(workflow, 'reply_webhook', {
      jobId: `reply-${externalEventId}`,
      externalEventId,
    })

    return NextResponse.json({ success: true, queued: true, jobId })
  } catch (error) {
    console.error('AI SDR reply webhook error:', error)
    return NextResponse.json({ error: `Webhook failed: ${String(error)}` }, { status: 500 })
  }
}

function validateWebhookSignature(req: NextRequest, rawBody: string, secret: string): void {
  if (!secret) {
    return
  }

  const signature = req.headers.get('x-ai-sdr-signature') || ''
  if (!signature) {
    throw new Error('Missing webhook signature')
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    throw new Error('Invalid webhook signature')
  }
}
