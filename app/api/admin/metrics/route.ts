import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireSuperAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const userId = requireAuth(request)
  if (!userId || !(await requireSuperAdmin(userId))) {
    return NextResponse.json({ error: 'Super admin required' }, { status: 403 })
  }

  const supabase = createClient() as any

  // Total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Active agents
  const { count: activeAgents } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // MRR (simplified - query Stripe/Razorpay via API or cached)
  const mrrUSD = 2500 // Placeholder - integrate Stripe API
  const mrrINR = 150000

  // Churn (placeholder)
  const churnRate = 4.2
  const agentUsage = 12500 // messages/day

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    activeAgents: activeAgents || 0,
    mrrUSD,
    mrrINR,
    churnRate,
    agentUsage,
  })
}

