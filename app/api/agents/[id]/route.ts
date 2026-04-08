import { NextRequest, NextResponse } from 'next/server'
import { resolveAuthIdentity } from '@/lib/auth/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export const runtime = 'nodejs'

function parseActivityDetails(value: unknown) {
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await resolveAuthIdentity(req)
    const { id: agentId } = await params

    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseAdmin

    // Resolve Supabase UUID from Clerk ID
    const { data: userRow } = await (supabase.from('users') as any)
      .select('id')
      .eq('clerk_id', identity.externalUserId)
      .single()

    if (!userRow) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const { data: agent, error } = await (supabase.from('agents') as any)
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userRow.id)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const { data: activities } = await (supabase.from('activity_logs') as any)
      .select('id, action, details, created_at')
      .eq('agent_id', agentId)
      .eq('user_id', userRow.id)
      .in('action', ['boot_task_seeded', 'agent_deployed'])
      .order('created_at', { ascending: false })

    const bootTasks = Array.isArray(activities)
      ? activities
          .filter((item) => item.action === 'boot_task_seeded')
          .map((item) => {
            const details = parseActivityDetails(item.details)
            return {
              id: item.id as string,
              created_at: item.created_at as string,
              title: String(details?.title || 'Boot task'),
              detail: String(details?.detail || ''),
              status: String(details?.status || 'queued'),
              source: String(details?.source || 'seeded'),
            }
          })
      : []

    return NextResponse.json({ agent, bootTasks })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await resolveAuthIdentity(req)
    const { id: agentId } = await params

    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseAdmin

    const { data: userRow } = await (supabase.from('users') as any)
      .select('id')
      .eq('clerk_id', identity.externalUserId)
      .single()

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = (await req.json()) as {
      business_name?: string
      business_description?: string
      agent_type?: string
      tone?: string
      active_hours_start?: number
      active_hours_end?: number
    }

    // Whitelist updatable fields
    const updateData: Record<string, unknown> = {}
    if (body.business_name !== undefined) updateData.business_name = body.business_name
    if (body.business_description !== undefined)
      updateData.business_description = body.business_description
    if (body.agent_type !== undefined) updateData.agent_type = body.agent_type
    if (body.tone !== undefined) updateData.tone = body.tone
    if (body.active_hours_start !== undefined)
      updateData.active_hours_start = body.active_hours_start
    if (body.active_hours_end !== undefined) updateData.active_hours_end = body.active_hours_end
    updateData.updated_at = new Date().toISOString()

    const { data: agent, error } = await (supabase.from('agents') as any)
      .update(updateData)
      .eq('id', agentId)
      .eq('user_id', (userRow as { id: string }).id)
      .select('*')
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
    }

    return NextResponse.json({ agent })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await resolveAuthIdentity(req)
    const { id: agentId } = await params

    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseAdmin

    const { data: userRow } = await (supabase.from('users') as any)
      .select('id')
      .eq('clerk_id', identity.externalUserId)
      .single()

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: deletedAgent, error } = await (supabase.from('agents') as any)
      .delete()
      .eq('id', agentId)
      .eq('user_id', (userRow as { id: string }).id)
      .select('id')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!deletedAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
