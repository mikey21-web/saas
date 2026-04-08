import { supabaseAdmin } from '@/lib/supabase/client'
import { RevenueForecastState } from '../types'

const STAGE_WEIGHTS: Record<string, number> = {
  appointmentscheduled: 0.20,
  qualifiedtobuy: 0.40,
  presentationscheduled: 0.60,
  decisionmakerboughtin: 0.75,
  contractsent: 0.90,
  closedwon: 1.0,
  closedlost: 0.0,
}

/**
 * Pipeline Agent: Fetches deals + historical data, computes metrics
 * Maps to n8n: Fetch HubSpot Pipeline + Fetch Historical Deals + Fetch Revenue Actuals → Compute Pipeline Metrics
 */
export async function pipelineAgent(state: RevenueForecastState): Promise<Partial<RevenueForecastState>> {
  const now = new Date()
  const day90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [dealsResult, historyResult, actualsResult] = await Promise.all([
    (supabaseAdmin.from('deals') as any)
      .select('id, name, amount, stage, close_date, stage_probability, last_activity_at')
      .gt('close_date', now.toISOString())
      .lt('close_date', day90.toISOString()),
    (supabaseAdmin.from('deals_history') as any)
      .select('outcome, amount, cycle_days')
      .gte('closed_at', oneYearAgo)
      .limit(500),
    (supabaseAdmin.from('revenue_actuals') as any)
      .select('month, revenue')
      .gte('month', sixMonthsAgo)
      .order('month', { ascending: true }),
  ])

  const activePipeline = dealsResult.data || []
  const history = historyResult.data || []
  const actuals = actualsResult.data || []

  // Weighted pipeline
  const weighted = activePipeline.reduce((sum: number, d: any) => {
    const w = STAGE_WEIGHTS[d.stage] ?? parseFloat(d.stage_probability ?? 0.3)
    return sum + (parseFloat(d.amount || 0) * w)
  }, 0)

  const totalPipeline = activePipeline.reduce((sum: number, d: any) => sum + parseFloat(d.amount || 0), 0)

  // Historical win rate + avg deal
  const wonDeals = history.filter((d: any) => d.outcome === 'won')
  const winRate = history.length > 0 ? wonDeals.length / history.length : 0.22
  const avgDeal = wonDeals.length > 0
    ? wonDeals.reduce((s: number, d: any) => s + parseFloat(d.amount || 0), 0) / wonDeals.length
    : 50000
  const avgCycle = wonDeals.length > 0
    ? wonDeals.reduce((s: number, d: any) => s + (d.cycle_days || 30), 0) / wonDeals.length
    : 30

  // MoM growth
  const recentMonths = actuals.slice(-3)
  const momGrowth = recentMonths.length >= 2
    ? (recentMonths[recentMonths.length - 1].revenue - recentMonths[0].revenue) / (recentMonths[0].revenue || 1) / (recentMonths.length - 1)
    : 0.05

  // Stale deals (no activity 14+ days)
  const staleDeals = activePipeline.filter((d: any) => {
    const lastActivity = new Date(d.last_activity_at || 0)
    return (now.getTime() - lastActivity.getTime()) > 14 * 24 * 60 * 60 * 1000
  })

  return {
    activePipelineCount: activePipeline.length,
    totalPipeline: Math.round(totalPipeline),
    weightedForecast: Math.round(weighted),
    historicalWinRate: Math.round(winRate * 100),
    avgDealValue: Math.round(avgDeal),
    avgSalesCycleDays: Math.round(avgCycle),
    momGrowthRate: Math.round(momGrowth * 100),
    staleDeals: staleDeals.map((d: any) => ({ name: d.name, amount: d.amount, stage: d.stage, closeDate: d.close_date })),
    staleDealCount: staleDeals.length,
  }
}
