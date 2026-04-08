import * as Sentry from '@sentry/node'
import { Job, Worker } from 'bullmq'
import { runAiSdrWorkflow } from './ai-sdr'
import { markWebhookEventStatus } from './integrations'
import { AI_SDR_QUEUE_NAME, AiSdrJobData } from './queue'

export interface AiSdrJobResult {
  success: boolean
  completedAt: string
  durationMs: number
}

let workerInstance: Worker<AiSdrJobData, AiSdrJobResult> | null = null

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

async function processAiSdrJob(job: Job<AiSdrJobData>): Promise<AiSdrJobResult> {
  const startedAt = Date.now()
  const externalEventId = job.data.externalEventId
  const source = job.data.source
  const workflow = job.data.workflow

  return Sentry.startSpan(
    {
      name: 'ai-sdr.job.process',
      op: 'queue.process',
      attributes: {
        'job.id': job.id,
        'job.source': source,
        'workflow.entry_point': workflow.entry_point,
        'workflow.agent_id': workflow.agent_id,
        'workflow.user_id': workflow.user_id,
      },
    },
    async () => {
      if (externalEventId && (source === 'reply_webhook' || source === 'calendly_webhook')) {
        await markWebhookEventStatus(externalEventId, source === 'reply_webhook' ? 'reply' : 'calendly', 'processing')
      }

      try {
        const result = await runAiSdrWorkflow(workflow)

        if (externalEventId && (source === 'reply_webhook' || source === 'calendly_webhook')) {
          await markWebhookEventStatus(externalEventId, source === 'reply_webhook' ? 'reply' : 'calendly', 'processed')
        }

        return {
          success: result.state.errors.length === 0,
          completedAt: new Date().toISOString(),
          durationMs: result.duration_ms,
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { job_id: job.id, source, entry_point: workflow.entry_point },
          extra: { workflow, external_event_id: externalEventId },
        })

        if (externalEventId && (source === 'reply_webhook' || source === 'calendly_webhook')) {
          await markWebhookEventStatus(
            externalEventId,
            source === 'reply_webhook' ? 'reply' : 'calendly',
            'failed',
            error instanceof Error ? error.message : String(error),
          )
        }
        throw error
      } finally {
        await job.updateProgress(Math.max(1, Date.now() - startedAt))
      }
    }
  )
}

export function createAiSdrWorker(): Worker<AiSdrJobData, AiSdrJobResult> {
  if (workerInstance) {
    return workerInstance
  }

  workerInstance = new Worker<AiSdrJobData, AiSdrJobResult>(AI_SDR_QUEUE_NAME, processAiSdrJob, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connection: getRedisConnection() as any,
    concurrency: parseInt(process.env.AI_SDR_WORKER_CONCURRENCY || '10', 10),
    limiter: {
      max: 200,
      duration: 60_000,
    },
    removeOnComplete: {
      age: 86_400,
      count: 1_000,
    },
    removeOnFail: {
      age: 604_800,
    },
  })

  workerInstance.on('failed', (job, error) => {
    console.error(`[AI SDR Worker] Job ${job?.id ?? 'unknown'} failed: ${error.message}`)
  })

  workerInstance.on('completed', (job) => {
    console.log(`[AI SDR Worker] Job ${job.id} completed`)
  })

  return workerInstance
}

export async function shutdownAiSdrWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close()
    workerInstance = null
  }
}
