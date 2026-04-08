import * as Sentry from '@sentry/node'
import { createAiSdrWorker, shutdownAiSdrWorker } from '../lib/ai-sdr'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.5,
  })
}

createAiSdrWorker()

async function shutdown(signal: string): Promise<void> {
  console.log(`[AI SDR Worker] Received ${signal}, shutting down...`)
  await shutdownAiSdrWorker()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})
