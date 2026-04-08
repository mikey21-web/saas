import { NextRequest, NextResponse } from 'next/server'
import { resolveAuthIdentity } from '@/lib/auth/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const identity = await resolveAuthIdentity(req)
    if (!identity) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = supabaseAdmin

    const { data: userRow } = await (supabase.from('users') as any)
      .select('id')
      .eq('clerk_id', identity.externalUserId)
      .single()

    if (!userRow) {
      return NextResponse.json({
        totalMessages: 0,
        activeAgents: 0,
        avgDurationMs: 0,
        dailyVolume: [],
        agentPerformance: [],
      })
    }

    // Get all agent IDs for this user
    const { data: agents } = await (supabase.from('agents') as any)
      .select('id, name, status')
      .eq('user_id', userRow.id)

    const agentIds = (agents || []).map((a: any) => a.id)
    const activeAgents = (agents || []).filter((a: any) => a.status === 'active').length

    if (agentIds.length === 0) {
      return NextResponse.json({
        totalMessages: 0,
        activeAgents,
        avgDurationMs: 0,
        dailyVolume: [],
        agentPerformance: [],
      })
    }

    // Total executions and avg duration
    const { data: execStats } = await (supabase.from('agent_executions') as any)
      .select('id, duration_ms, created_at, agent_id, success')
      .in('agent_id', agentIds)
      .order('created_at', { ascending: false })
      .limit(500)

    const executions = execStats || []
    const totalMessages = executions.length
    const avgDurationMs =
      totalMessages > 0
        ? Math.round(
            executions.reduce((sum: number, e: any) => sum + (e.duration_ms || 0), 0) /
              totalMessages
          )
        : 0

    // Daily volume for last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dailyMap: Record<string, number> = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      dailyMap[days[d.getDay()]] = 0
    }

    for (const exec of executions) {
      const d = new Date(exec.created_at)
      const dayName = days[d.getDay()]
      if (dayName in dailyMap) dailyMap[dayName] = (dailyMap[dayName] || 0) + 1
    }

    const dailyVolume = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      messages: count,
    }))

    // Per-agent performance
    const agentPerformance = (agents || []).map((agent: any) => {
      const agentExecs = executions.filter((e: any) => e.agent_id === agent.id)
      const agentAvg =
        agentExecs.length > 0
          ? Math.round(
              agentExecs.reduce((s: number, e: any) => s + (e.duration_ms || 0), 0) /
                agentExecs.length
            )
          : 0
      const successRate =
        agentExecs.length > 0
          ? Math.round((agentExecs.filter((e: any) => e.success).length / agentExecs.length) * 100)
          : 100

      return {
        name: agent.name,
        messages: agentExecs.length,
        avgMs: agentAvg,
        successRate,
        status: agent.status,
      }
    })

    return NextResponse.json({
      totalMessages,
      activeAgents,
      avgDurationMs,
      dailyVolume,
      agentPerformance,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
