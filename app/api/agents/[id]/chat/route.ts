/**
 * Streaming Chat API — POST /api/agents/[id]/chat
 *
 * Accepts { message, channel } and either:
 * - Executes inline (for real-time chat) returning a streaming response
 * - Queues a BullMQ job (for async channels like email/SMS)
 *
 * Returns streaming response using ReadableStream for chat,
 * or job ID for async execution.
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveAuthIdentity } from '@/lib/auth/server'
import { executeAgent } from '@/lib/agent/executor'
import type { ExecutionTrigger } from '@/lib/agent/executor'
import { queueAgentJob } from '@/lib/queue/producer'
import { supabaseAdmin } from '@/lib/supabase/client'

// Use Node.js runtime (Clerk uses MessageChannel which isn't supported in Edge Runtime)
export const runtime = 'nodejs'

async function verifyOwnedAgentAndConversation(userId: string, agentId: string, conversationId?: string) {
  const { data: agent } = await (supabaseAdmin.from('agents') as any)
    .select('id')
    .eq('id', agentId)
    .eq('user_id', userId)
    .single()

  if (!agent) {
    return { ok: false as const, error: 'Agent not found' }
  }

  if (!conversationId) {
    return { ok: true as const }
  }

  const { data: conversation } = await (supabaseAdmin.from('conversations') as any)
    .select('id')
    .eq('id', conversationId)
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .single()

  if (!conversation) {
    return { ok: false as const, error: 'Conversation not found' }
  }

  return { ok: true as const }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatRequestBody {
  message: string
  channel?: 'whatsapp' | 'email' | 'sms' | 'phone'
  conversationId?: string
  senderName?: string
  async?: boolean
}

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const jwtIdentity = await resolveAuthIdentity(request)
    const userId = jwtIdentity?.supabaseUserId || jwtIdentity?.externalUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as ChatRequestBody

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "message" field' }, { status: 400 })
    }

    const { id: agentId } = await params
    const channel = body.channel ?? 'whatsapp'
    const conversationId = body.conversationId ?? `conv_${agentId}_${Date.now()}`

    const access = await verifyOwnedAgentAndConversation(userId, agentId, body.conversationId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: 404 })
    }

    const trigger: ExecutionTrigger = {
      agentId,
      userId,
      message: body.message,
      channel,
      conversationId,
      senderName: body.senderName,
    }

    // ─── Async Mode: Queue the job and return job ID ─────────────────
    if (body.async || channel === 'email' || channel === 'sms') {
      const { jobId } = await queueAgentJob(trigger)

      return NextResponse.json({
        mode: 'async',
        jobId,
        message: 'Job queued for processing',
        agentId,
        conversationId,
      })
    }

    // ─── Streaming Mode: Execute inline and stream response ──────────
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event
          controller.enqueue(encoder.encode(formatSSE({ type: 'start', agentId, conversationId })))

          // Execute the agent
          const result = await executeAgent(trigger)

          // Stream the response content in chunks
          const responseText = result.response
          const chunkSize = 50 // Characters per chunk for smooth streaming
          let offset = 0

          while (offset < responseText.length) {
            const chunk = responseText.slice(offset, offset + chunkSize)
            controller.enqueue(encoder.encode(formatSSE({ type: 'chunk', content: chunk })))
            offset += chunkSize
          }

          // Send execution metadata
          controller.enqueue(
            encoder.encode(
              formatSSE({
                type: 'done',
                success: result.success,
                toolCallsCount: result.toolCallsCount,
                iterationCount: result.iterationCount,
                costINR: result.totalCostINR,
                provider: result.provider,
                model: result.model,
                durationMs: result.durationMs,
                needsEscalation: result.needsEscalation,
              })
            )
          )

          controller.close()
        } catch (e: unknown) {
          const errorMsg = e instanceof Error ? e.message : 'Unknown error'
          controller.enqueue(encoder.encode(formatSSE({ type: 'error', error: errorMsg })))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Agent-Id': agentId,
        'X-Conversation-Id': conversationId,
      },
    })
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error'

    return NextResponse.json(
      { error: 'Failed to process chat request', details: errorMsg },
      { status: 500 }
    )
  }
}

// ─── SSE Formatting ──────────────────────────────────────────────────────────

function formatSSE(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`
}
