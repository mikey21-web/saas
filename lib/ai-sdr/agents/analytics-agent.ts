import {
  generateAnalyticsInsights,
  queryAnalyticsMetrics,
  saveAnalyticsReport,
} from '../integrations'
import { AnalyticsOutput, AnalyticsReportRecord, WorkflowMetrics, WorkflowState } from '../types'
import { bestVariant, computeRates, createId, defaultAnalyticsWindow } from '../utils'

export async function analyticsAgent(state: WorkflowState): Promise<Partial<WorkflowState>> {
  const window = state.trigger_payload?.analytics_window ?? defaultAnalyticsWindow()
  const metricsBase = await queryAnalyticsMetrics(state.user_id, window)
  const rates = computeRates(metricsBase.leadsFound, metricsBase.repliesReceived, metricsBase.meetingsBooked)

  const metrics: WorkflowMetrics = {
    leads_found: metricsBase.leadsFound,
    replies_received: metricsBase.repliesReceived,
    meetings_booked: metricsBase.meetingsBooked,
    reply_rate: rates.reply_rate,
    meeting_rate: rates.meeting_rate,
    conversion_rate: rates.conversion_rate,
    cost_per_meeting: metricsBase.meetingsBooked > 0 ? Number((metricsBase.leadsFound * 3.5 / metricsBase.meetingsBooked).toFixed(2)) : 0,
    channel_performance: metricsBase.channelPerformance,
    best_times: metricsBase.bestTimes,
    variant_performance: metricsBase.variantPerformance,
  }

  const insights = await generateAnalyticsInsights(metrics, { window })
  const report: AnalyticsReportRecord = {
    id: createId('analytics'),
    user_id: state.user_id,
    agent_id: state.agent_id,
    generated_at: new Date(),
    window_start: new Date(window.start),
    window_end: new Date(window.end),
    metrics,
    insights,
    best_variant: bestVariant(metrics.variant_performance),
  }

  await saveAnalyticsReport(report)

  const output: AnalyticsOutput = { metrics, insights }

  return {
    current_step: 'analytics',
    next_step: 'completed',
    analytics_output: output,
    errors: state.errors,
    completed_at: new Date(),
  }
}
