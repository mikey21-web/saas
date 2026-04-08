interface BucketConfig {
  tokensPerMinute: number
}

class TokenBucket {
  private tokens: number
  private readonly maxTokens: number
  private lastRefill: number
  private readonly refillIntervalMs: number
  private queue: Array<{ resolve: () => void; timestamp: number }> = []

  constructor(tokensPerMinute: number) {
    this.maxTokens = tokensPerMinute
    this.tokens = tokensPerMinute
    this.lastRefill = Date.now()
    this.refillIntervalMs = 60_000 / tokensPerMinute
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs)
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
      this.lastRefill += tokensToAdd * this.refillIntervalMs
    }
  }

  async acquire(): Promise<void> {
    this.refill()
    if (this.tokens > 0) {
      this.tokens--
      return
    }

    return new Promise<void>((resolve) => {
      this.queue.push({ resolve, timestamp: Date.now() })
      const waitMs = this.refillIntervalMs * 1.2
      setTimeout(() => {
        this.refill()
        if (this.tokens > 0) {
          this.tokens--
          const entry = this.queue.shift()
          entry?.resolve()
        } else {
          const entry = this.queue.shift()
          if (entry) {
            this.queue.unshift(entry)
          }
        }
      }, waitMs)
    })
  }
}

const serviceConfigs: Record<string, BucketConfig> = {
  apollo: { tokensPerMinute: parseInt(process.env.APOLLO_RATE_LIMIT_PER_MIN || '50', 10) },
  linkedin: { tokensPerMinute: parseInt(process.env.LINKEDIN_RATE_LIMIT_PER_MIN || '20', 10) },
  whatsapp: { tokensPerMinute: parseInt(process.env.WHATSAPP_RATE_LIMIT_PER_MIN || '80', 10) },
  groq: { tokensPerMinute: parseInt(process.env.GROQ_RATE_LIMIT_PER_MIN || '30', 10) },
  anthropic: { tokensPerMinute: parseInt(process.env.ANTHROPIC_RATE_LIMIT_PER_MIN || '50', 10) },
  email: { tokensPerMinute: parseInt(process.env.EMAIL_RATE_LIMIT_PER_MIN || '10', 10) },
}

const buckets = new Map<string, TokenBucket>()

function getBucket(service: string): TokenBucket {
  if (!buckets.has(service)) {
    const config = serviceConfigs[service]
    if (!config) {
      throw new Error(`Rate limiter config not found for service: ${service}`)
    }
    buckets.set(service, new TokenBucket(config.tokensPerMinute))
  }
  return buckets.get(service)!
}

export async function acquireRateLimit(service: string): Promise<void> {
  const bucket = getBucket(service)
  await bucket.acquire()
}

export { TokenBucket }
