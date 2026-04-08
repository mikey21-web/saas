import { NextRequest, NextResponse } from 'next/server'
import { resolveAuthIdentity } from '@/lib/auth/server'
import { queueAiSdrJob } from '@/lib/ai-sdr/queue'
import { WorkflowEntryPoint, WorkflowTriggerPayload } from '@/lib/ai-sdr/types'

export const runtime = 'nodejs'

interface RequestBody {
  agentId: string
  entryPoint?: WorkflowEntryPoint
  triggerPayload?: WorkflowTriggerPayload
}

export async function POST(req: NextRequest) {
  try {
    const identity = await resolveAuthIdentity(req)
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as RequestBody
    const entryPoint = body.entryPoint ?? 'lead_finder'

    if (!body.agentId) {
      return NextResponse.json({ error: 'Missing required field: agentId' }, { status: 400 })
    }

    const workflow = {
      agent_id: body.agentId,
      user_id: identity.supabaseUserId,
      entry_point: entryPoint,
      trigger_payload: body.triggerPayload,
    }

    const { jobId } = await queueAiSdrJob(workflow, 'api')

    return NextResponse.json({
      success: true,
      queued: true,
      jobId,
      workflow,
    })
  } catch (error) {
    console.error('AI SDR workflow execution error:', error)
    return NextResponse.json({ error: `Workflow failed: ${String(error)}` }, { status: 500 })
  }
}
