import { scheduleAiSdrRecurringJob } from './queue'
import { RunAISdrInput } from './types'

export async function registerAiSdrSchedules(params: { agent_id: string; user_id: string }): Promise<{ leadFinderJobId: string; analyticsJobId: string }> {
  const leadFinderWorkflow: RunAISdrInput = {
    agent_id: params.agent_id,
    user_id: params.user_id,
    entry_point: 'lead_finder',
  }

  const analyticsWorkflow: RunAISdrInput = {
    agent_id: params.agent_id,
    user_id: params.user_id,
    entry_point: 'analytics',
  }

  const leadFinderJob = await scheduleAiSdrRecurringJob({
    cronExpression: '0 */6 * * *',
    workflow: leadFinderWorkflow,
    source: 'cron',
    jobId: `ai-sdr-lead-finder-${params.agent_id}`,
  })

  const analyticsJob = await scheduleAiSdrRecurringJob({
    cronExpression: '0 0 * * *',
    workflow: analyticsWorkflow,
    source: 'cron',
    jobId: `ai-sdr-analytics-${params.agent_id}`,
  })

  return {
    leadFinderJobId: leadFinderJob.jobId,
    analyticsJobId: analyticsJob.jobId,
  }
}
