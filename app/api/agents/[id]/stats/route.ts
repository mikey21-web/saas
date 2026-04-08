import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveAuthIdentity } from '@/lib/auth/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await resolveAuthIdentity(request)
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params

    // Verify agent belongs to user (via clerk_id lookup)
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', identity.externalUserId)
      .single()

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', userRow.id)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // All executions
    const { data: executions } = await supabaseAdmin
      .from('agent_executions')
      .select('success, duration_ms, created_at')
      .eq('agent_id', agentId)

    const total = executions?.length || 0
    const successful = executions?.filter((e) => e.success).length || 0

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const today = executions?.filter((e) => new Date(e.created_at) >= todayStart).length || 0

    const durations =
      executions
        ?.map((e) => e.duration_ms)
        .filter((d): d is number => typeof d === 'number' && d > 0) || []
    const avgDuration =
      durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

    return NextResponse.json({ total, successful, today, avgDuration })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
