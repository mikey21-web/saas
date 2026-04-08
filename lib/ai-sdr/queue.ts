import { Queue, QueueEvents } from 'bullmq'
import { RunAISdrInput } from './types'

export const AI_SDR_QUEUE_NAME = 'ai-sdr-execution'

export interface AiSdrJobData {
  workflow: RunAISdrInput
  source: 'api' | 'reply_webhook' | 'calendly_webhook' | 'cron'
  externalEventId?: string
}

export interface QueueAiSdrOptions {
  priority?: number
  delay?: number
  jobId?: string
  externalEventId?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let queueInstance: any = null
let queueEventsInstance: QueueEvents | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRedisConnection(): any {
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) {
    return redisUrl
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  }
}

function getQueue(): Queue<AiSdrJobData> {
  if (!queueInstance) {
    queueInstance = new Queue<AiSdrJobData>(AI_SDR_QUEUE_NAME, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      connection: getRedisConnection() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { age: 86_400, count: 1_000 },
        removeOnFail: { age: 604_800 },
      },
    })
  }
  return queueInstance
}

function getQueueEvents(): QueueEvents {
  if (!queueEventsInstance) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queueEventsInstance = new QueueEvents(AI_SDR_QUEUE_NAME, { connection: getRedisConnection() as any })
  }
  return queueEventsInstance
}

export async function queueAiSdrJob(
  workflow: RunAISdrInput,
  source: AiSdrJobData['source'],
  options: QueueAiSdrOptions = {},
): Promise<{ jobId: string }> {
  const queue = getQueue()
  const externalEventId =
    options.externalEventId ??
    workflow.trigger_payload?.calendly_event?.event_id ??
    workflow.trigger_payload?.reply?.sequence_id
  const job = await queue.add(
    `ai-sdr-${workflow.entry_point}-${workflow.agent_id}`,
    { workflow, source, externalEventId },
    {
      priority: options.priority ?? 0,
      delay: options.delay,
      jobId: options.jobId,
    },
  )

  return { jobId: job.id ?? `ai-sdr-${Date.now()}` }
}

export async function scheduleAiSdrRecurringJob(options: {
  cronExpression: string
  workflow: RunAISdrInput
  source?: AiSdrJobData['source']
  jobId?: string
  timezone?: string
}): Promise<{ jobId: string }> {
  const queue = getQueue()
  const jobId = options.jobId ?? `ai-sdr-repeat-${options.workflow.agent_id}-${options.workflow.entry_point}`

  await queue.add(
    `ai-sdr-repeat-${options.workflow.entry_point}-${options.workflow.agent_id}`,
    {
      workflow: options.workflow,
      source: options.source ?? 'cron',
    },
    {
      repeat: {
        pattern: options.cronExpression,
        tz: options.timezone ?? 'Asia/Kolkata',
      },
      jobId,
    },
  )

  return { jobId }
}

export async function waitForAiSdrJob(jobId: string, timeoutMs: number = 60_000): Promise<unknown> {
  const queue = getQueue()
  const job = await queue.getJob(jobId)
  if (!job) {
    throw new Error(`AI SDR job ${jobId} not found`)
  }
  const events = getQueueEvents()
  await events.waitUntilReady()
  return job.waitUntilFinished(events, timeoutMs)
}

export async function closeAiSdrQueue(): Promise<void> {
  if (queueInstance) {
    await queueInstance.close()
    queueInstance = null
  }
  if (queueEventsInstance) {
    await queueEventsInstance.close()
    queueEventsInstance = null
  }
}
