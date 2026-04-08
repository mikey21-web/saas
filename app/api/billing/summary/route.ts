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
      return NextResponse.json({ agentCount: 0, executionsThisMonth: 0 })
    }

    // Agent count
    const { count: agentCount } = await (supabase.from('agents') as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userRow.id)
      .eq('status', 'active')

    // Executions this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: agents } = await (supabase.from('agents') as any)
      .select('id')
      .eq('user_id', userRow.id)

    const agentIds = (agents || []).map((a: any) => a.id)

    let executionsThisMonth = 0
    if (agentIds.length > 0) {
      const { count } = await (supabase.from('agent_executions') as any)
        .select('id', { count: 'exact', head: true })
        .in('agent_id', agentIds)
        .gte('created_at', startOfMonth.toISOString())

      executionsThisMonth = count || 0
    }

    return NextResponse.json({ agentCount: agentCount || 0, executionsThisMonth })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
