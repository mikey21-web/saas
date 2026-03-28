/**
 * BullMQ Producer — queue agent execution jobs
 *
 * Functions:
 * - queueAgentJob: add a one-time execution job
 * - scheduleAgentJob: add a recurring cron job
 * - pauseAllAgents: drain all jobs for a user (emergency kill switch)
 * - getJobStatus: check status of a queued job
 */

import { Queue, QueueEvents } from 'bullmq'
import type { ExecutionTrigger } from '@/lib/agent/executor'
import { AGENT_QUEUE_NAME } from '@/lib/queue/worker'
import type { AgentJobData } from '@/lib/queue/worker'
import { activateKillSwitch } from '@/lib/agent/safety'

// ─── Redis Connection ────────────────────────────────────────────────────────

function getRedisConnection() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null as null,
  }
}

// ─── Queue Singleton ─────────────────────────────────────────────────────────

let queueInstance: Queue<AgentJobData> | null = null
let queueEventsInstance: QueueEvents | null = null

function getQueue(): Queue<AgentJobData> {
  if (!queueInstance) {
    queueInstance = new Queue<AgentJobData>(AGENT_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 86_400,
          count: 1000,
        },
        removeOnFail: {
          age: 604_800,
        },
      },
    })
  }
  return queueInstance
}

function getQueueEvents(): QueueEvents {
  if (!queueEventsInstance) {
    queueEventsInstance = new QueueEvents(AGENT_QUEUE_NAME, {
      connection: getRedisConnection(),
    })
  }
  return queueEventsInstance
}

// ─── Queue a One-Time Agent Job ──────────────────────────────────────────────

export interface QueueJobOptions {
  priority?: number
  delay?: number
  jobId?: string
}

export async function queueAgentJob(
  trigger: ExecutionTrigger,
  options: QueueJobOptions = {}
): Promise<{ jobId: string }> {
  const queue = getQueue()

  const job = await queue.add(
    `agent-${trigger.agentId}`,
    { trigger, priority: options.priority },
    {
      priority: options.priority ?? 0,
      delay: options.delay,
      jobId: options.jobId,
    }
  )

  console.log(`[Producer] Queued job ${job.id} for agent ${trigger.agentId}`)

  return { jobId: job.id ?? `unknown-${Date.now()}` }
}

// ─── Schedule a Recurring Agent Job ──────────────────────────────────────────

export interface ScheduleJobOptions {
  cronExpression: string
  trigger: ExecutionTrigger
  jobId?: string
  timezone?: string
}

export async function scheduleAgentJob(
  options: ScheduleJobOptions
): Promise<{ jobId: string }> {
  const queue = getQueue()

  const jobId = options.jobId ?? `scheduled-${options.trigger.agentId}-${Date.now()}`

  await queue.add(
    `scheduled-${options.trigger.agentId}`,
    { trigger: options.trigger },
    {
      repeat: {
        pattern: options.cronExpression,
        tz: options.timezone ?? 'Asia/Kolkata',
      },
      jobId,
    }
  )

  console.log(
    `[Producer] Scheduled recurring job ${jobId} for agent ${options.trigger.agentId} ` +
    `with cron: ${options.cronExpression}`
  )

  return { jobId }
}

// ─── Pause All Agents for a User ─────────────────────────────────────────────

export async function pauseAllAgents(userId: string): Promise<{ removedCount: number }> {
  const queue = getQueue()

  // Activate the kill switch so running agents stop at next safety check
  activateKillSwitch(userId)

  // Remove all waiting jobs that belong to this user
  const waitingJobs = await queue.getWaiting(0, 1000)
  const delayedJobs = await queue.getDelayed(0, 1000)

  const allJobs = [...waitingJobs, ...delayedJobs]
  let removedCount = 0

  for (const job of allJobs) {
    if (job.data.trigger.userId === userId) {
      await job.remove()
      removedCount++
    }
  }

  // Remove repeatable jobs for this user
  const repeatableJobs = await queue.getRepeatableJobs()
  for (const rJob of repeatableJobs) {
    // Repeatable job names contain the agent ID; check if they belong to this user
    // In production, store userId mapping. For now, remove by name pattern.
    if (rJob.name.includes(userId)) {
      await queue.removeRepeatableByKey(rJob.key)
      removedCount++
    }
  }

  console.log(`[Producer] Paused all agents for user ${userId}. Removed ${removedCount} jobs.`)

  return { removedCount }
}

// ─── Job Status ──────────────────────────────────────────────────────────────

export interface JobStatus {
  id: string
  state: string
  progress: unknown
  data: AgentJobData
  failedReason?: string
  finishedOn?: number
  processedOn?: number
}

export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const queue = getQueue()
  const job = await queue.getJob(jobId)

  if (!job) return null

  const state = await job.getState()

  return {
    id: job.id ?? jobId,
    state,
    progress: job.progress,
    data: job.data,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
    processedOn: job.processedOn,
  }
}

// ─── Wait for Job Completion ─────────────────────────────────────────────────

export async function waitForJob(
  jobId: string,
  timeoutMs: number = 60_000
): Promise<unknown> {
  const queue = getQueue()
  const job = await queue.getJob(jobId)

  if (!job) {
    throw new Error(`Job ${jobId} not found`)
  }

  const events = getQueueEvents()
  await events.waitUntilReady()

  const result = await job.waitUntilFinished(events, timeoutMs)
  return result
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

export async function closeQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close()
    queueInstance = null
  }
  if (queueEventsInstance) {
    await queueEventsInstance.close()
    queueEventsInstance = null
  }
}
