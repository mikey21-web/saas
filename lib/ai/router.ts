/**
 * AI Model Router — cascading fallback chain
 * Groq (fastest, free tier) → Gemini (Google) → Kimi (Moonshot backup)
 * Each provider gets one attempt before falling through.
 */

export interface ModelProvider {
  provider: 'groq' | 'gemini' | 'kimi'
  model: string
  endpoint: string
  apiKeyEnv: string
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface AIResponse {
  content: string | null
  tool_calls: ToolCall[]
  provider: string
  model: string
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

const modelFallbackChain: ModelProvider[] = [
  {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKeyEnv: 'GROQ_API_KEY',
  },
  {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    apiKeyEnv: 'GOOGLE_GENERATIVE_AI_API_KEY',
  },
  {
    provider: 'kimi',
    model: 'kimi-k2.5',
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    apiKeyEnv: 'KIMI_API_KEY',
  },
]

interface CallAIOptions {
  messages: AIMessage[]
  tools?: ToolDefinition[]
  temperature?: number
  maxTokens?: number
  /** Override the default fallback chain with a specific provider */
  forceProvider?: 'groq' | 'gemini' | 'kimi'
}

async function callProvider(provider: ModelProvider, options: CallAIOptions): Promise<AIResponse> {
  const apiKey = process.env[provider.apiKeyEnv] || ''

  if (!apiKey) {
    throw new Error(`Missing API key for ${provider.provider} (env: ${provider.apiKeyEnv})`)
  }

  const body: Record<string, unknown> = {
    model: provider.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
  }

  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools
    body.tool_choice = 'auto'
  }

  const res = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error')
    throw new Error(`${provider.provider} API error ${res.status}: ${errorText}`)
  }

  const data = (await res.json()) as {
    choices: Array<{
      message: {
        content: string | null
        tool_calls?: ToolCall[]
      }
    }>
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  }

  const choice = data.choices?.[0]
  if (!choice) {
    throw new Error(`${provider.provider} returned empty response`)
  }

  return {
    content: choice.message.content,
    tool_calls: choice.message.tool_calls ?? [],
    provider: provider.provider,
    model: provider.model,
    usage: {
      prompt_tokens: data.usage?.prompt_tokens ?? 0,
      completion_tokens: data.usage?.completion_tokens ?? 0,
      total_tokens: data.usage?.total_tokens ?? 0,
    },
  }
}

/**
 * Call AI with automatic fallback across providers.
 * Tries Groq → Gemini → Kimi. If all fail, throws the last error.
 */
export async function callAI(options: CallAIOptions): Promise<AIResponse> {
  // If a specific provider is forced, only try that one
  if (options.forceProvider) {
    const provider = modelFallbackChain.find((p) => p.provider === options.forceProvider)
    if (!provider) {
      throw new Error(`Unknown provider: ${options.forceProvider}`)
    }
    return callProvider(provider, options)
  }

  const errors: string[] = []

  for (const provider of modelFallbackChain) {
    try {
      return await callProvider(provider, options)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`[${provider.provider}] ${msg}`)
      // Continue to next provider
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`)
}

/**
 * Estimate cost for a given usage in INR.
 * Rough per-1K-token rates for budgeting / safety checks.
 */
export function estimateCostINR(
  provider: string,
  usage: { prompt_tokens: number; completion_tokens: number }
): number {
  // Approximate rates in INR per 1K tokens (input + output blended)
  const rates: Record<string, { input: number; output: number }> = {
    groq: { input: 0.05, output: 0.08 }, // Near-free tier
    gemini: { input: 0.03, output: 0.06 }, // Google free tier generous
    kimi: { input: 0.1, output: 0.15 }, // Moonshot pricing
  }

  const rate = rates[provider] ?? { input: 0.1, output: 0.15 }
  const inputCost = (usage.prompt_tokens / 1000) * rate.input
  const outputCost = (usage.completion_tokens / 1000) * rate.output

  return Math.round((inputCost + outputCost) * 100) / 100
}
