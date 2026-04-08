/**
 * BullMQ Worker — processes agent execution jobs from Redis queue
 *
 * Connects to Redis, listens for 'agent-execution' jobs,
 * runs the executor, and handles failures gracefully.
 */

import { Worker, Job } from 'bullmq'
import { executeAgent } from '@/lib/agent/executor'
import type { ExecutionTrigger, ExecutionResult } from '@/lib/agent/executor'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AgentJobData {
  trigger: ExecutionTrigger
  priority?: number
  retryCount?: number
}

export interface AgentJobResult {
  executionResult: ExecutionResult
  completedAt: string
}

// ─── Redis Connection Config ─────────────────────────────────────────────────

function getRedisConnection() {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null as null,
  }
}

// ─── Queue Name ──────────────────────────────────────────────────────────────

export const AGENT_QUEUE_NAME = 'agent-execution'

// ─── Job Processor ───────────────────────────────────────────────────────────

async function processAgentJob(job: Job<AgentJobData>): Promise<AgentJobResult> {
  const { trigger } = job.data

  console.log(
    `[Worker] Processing job ${job.id} — agent: ${trigger.agentId}, channel: ${trigger.channel}`
  )

  await job.updateProgress(10)

  try {
    const executionResult = await executeAgent(trigger)

    await job.updateProgress(100)

    console.log(
      `[Worker] Job ${job.id} completed — success: ${executionResult.success}, ` +
        `iterations: ${executionResult.iterationCount}, tools: ${executionResult.toolCallsCount}, ` +
        `cost: ₹${executionResult.totalCostINR.toFixed(2)}, duration: ${executionResult.durationMs}ms`
    )

    if (executionResult.needsEscalation) {
      console.log(`[Worker] Job ${job.id} flagged for escalation`)
      // TODO: Push to inbox / notify human agent
    }

    if (!executionResult.success) {
      console.error(`[Worker] Job ${job.id} execution failed: ${executionResult.error}`)
    }

    return {
      executionResult,
      completedAt: new Date().toISOString(),
    }
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e)
    console.error(`[Worker] Job ${job.id} threw error: ${errorMsg}`)
    throw e // Let BullMQ handle retry
  }
}

// ─── Create Worker ───────────────────────────────────────────────────────────

let workerInstance: Worker<AgentJobData, AgentJobResult> | null = null

export function createAgentWorker(): Worker<AgentJobData, AgentJobResult> {
  if (workerInstance) {
    return workerInstance
  }

  const worker = new Worker<AgentJobData, AgentJobResult>(AGENT_QUEUE_NAME, processAgentJob, {
    connection: getRedisConnection(),
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
    limiter: {
      max: 100,
      duration: 60_000, // 100 jobs per minute max
    },
    removeOnComplete: {
      age: 86_400, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 604_800, // Keep failed jobs for 7 days
    },
  })

  // ─── Event Handlers ──────────────────────────────────────────────────

  worker.on('completed', (job: Job<AgentJobData, AgentJobResult>) => {
    console.log(`[Worker] Job ${job.id} completed successfully`)
  })

  worker.on('failed', (job: Job<AgentJobData, AgentJobResult> | undefined, err: Error) => {
    console.error(`[Worker] Job ${job?.id ?? 'unknown'} failed: ${err.message}`)
    // TODO: Send alert to user if repeated failures
  })

  worker.on('error', (err: Error) => {
    console.error(`[Worker] Worker error: ${err.message}`)
  })

  worker.on('stalled', (jobId: string) => {
    console.warn(`[Worker] Job ${jobId} stalled — will be retried`)
  })

  workerInstance = worker
  console.log('[Worker] Agent execution worker started')

  return worker
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

export async function shutdownWorker(): Promise<void> {
  if (workerInstance) {
    console.log('[Worker] Shutting down worker...')
    await workerInstance.close()
    workerInstance = null
    console.log('[Worker] Worker shut down successfully')
  }
}
