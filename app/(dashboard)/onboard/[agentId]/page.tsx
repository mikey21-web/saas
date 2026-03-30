'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Script from 'next/script'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AgentConfig {
  businessName: string
  industry: string
  products: string
  targetCustomers: string
  tone: string
  language: string
  agentPersonality: string
  activeHours: string
  keyInstructions: string
  agentName: string
}

const PLAN_PRICES = {
  intern: { inr: 999, usd: 25, label: 'Intern Plan' },
  agent: { inr: 2499, usd: 50, label: 'Agent Plan' },
}

function extractAgentConfig(text: string): AgentConfig | null {
  const match = text.match(/```AGENT_CONFIG\n([\s\S]*?)```/)
  if (!match) return null
  try {
    return JSON.parse(match[1]) as AgentConfig
  } catch {
    return null
  }
}

function stripConfigBlock(text: string): string {
  return text.replace(/```AGENT_CONFIG\n[\s\S]*?```/, '').trim()
}

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

export default function OnboardPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useUser()

  const agentId = params.agentId as string
  const agentName = searchParams.get('name') || agentId
  const agentIcon = searchParams.get('icon') || '🤖'
  const selectedPlan = (searchParams.get('plan') || 'agent') as 'intern' | 'agent'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const streamingMessageRef = useRef('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Start interview on mount
  useEffect(() => {
    startInterview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const streamResponse = useCallback(async (userMessages: Message[]) => {
    setIsStreaming(true)
    streamingMessageRef.current = ''

    // Add empty assistant message placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/onboard/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType: agentName, messages: userMessages }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data) as { token?: string; error?: string }
            if (parsed.token) {
              streamingMessageRef.current += parsed.token
              const fullText = streamingMessageRef.current

              // Update the last message in real-time
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: fullText,
                }
                return updated
              })
            }
          } catch {
            // skip
          }
        }
      }

      // Check if config is complete
      const finalText = streamingMessageRef.current
      const config = extractAgentConfig(finalText)
      if (config) {
        setAgentConfig(config)
        // Clean the display message
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: stripConfigBlock(finalText),
          }
          return updated
        })
      }

    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I had a connection issue. Please try again.',
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }, [agentName])

  const startInterview = useCallback(async () => {
    await streamResponse([])
    setQuestionCount(1)
  }, [streamResponse])

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setQuestionCount(q => q + 1)

    // Only send user messages to API (exclude streaming placeholders)
    const apiMessages = newMessages.filter(m => m.content.length > 0)
    await streamResponse(apiMessages)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleQuickDeploy = async () => {
    if (!user || !agentConfig) return
    setIsDeploying(true)

    // Open Razorpay
    if (!razorpayLoaded || !window.Razorpay) {
      // Fallback to Stripe or direct deploy if Razorpay not loaded
      await deployAgent()
      return
    }

    const plan = PLAN_PRICES[selectedPlan]

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: plan.inr * 100,
      currency: 'INR',
      name: 'diyaa.ai',
      description: `${agentConfig.agentName} — ${plan.label}`,
      image: '/logo.png',
      notes: {
        agentType: agentName,
        userId: user.id,
        plan: selectedPlan,
      },
      theme: { color: '#2563EB' },
      handler: async (response: { razorpay_payment_id: string }) => {
        await deployAgent(response.razorpay_payment_id)
      },
      modal: {
        ondismiss: () => setIsDeploying(false),
      },
    }

    try {
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      // Razorpay not available, deploy directly
      await deployAgent()
    }
  }

  const deployAgent = async (paymentId?: string) => {
    if (!user || !agentConfig) return
    setIsDeploying(true)

    try {
      const res = await fetch('/api/onboard/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: agentName,
          agentIcon,
          config: agentConfig,
          userId: user.id,
          plan: selectedPlan,
          paymentId,
        }),
      })

      const data = await res.json() as { success: boolean; agentId: string; agentName: string }

      if (data.success) {
        router.push(
          `/onboard/success?agentId=${data.agentId}&agentName=${encodeURIComponent(data.agentName)}&icon=${encodeURIComponent(agentIcon)}`
        )
      }
    } catch (err) {
      console.error('Deploy failed:', err)
      setIsDeploying(false)
    }
  }

  const progressPercent = Math.min((questionCount / 6) * 100, 100)
  const isComplete = !!agentConfig

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="text-3xl">{agentIcon}</div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">{agentName} Setup</h2>
            <p className="text-xs text-gray-500">
              {isComplete ? 'Configuration complete! Ready to deploy.' : `Customizing for your business`}
            </p>
          </div>
          {/* Progress Bar */}
          <div className="w-24">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{isComplete ? 'Done' : `Q${questionCount}/6`}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 border-x border-gray-200 p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                }`}
              >
                {msg.content || (
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm ml-2 flex-shrink-0 mt-1">
                  👤
                </div>
              )}
            </div>
          ))}

          {/* Config Ready Card */}
          {isComplete && agentConfig && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">✅</span>
                <h3 className="font-bold text-gray-900">Agent Configured!</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-white rounded-lg p-2 border border-blue-100">
                  <p className="text-gray-500">Business</p>
                  <p className="font-semibold text-gray-800">{agentConfig.businessName}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-blue-100">
                  <p className="text-gray-500">Industry</p>
                  <p className="font-semibold text-gray-800">{agentConfig.industry}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-blue-100">
                  <p className="text-gray-500">Tone</p>
                  <p className="font-semibold text-gray-800 capitalize">{agentConfig.tone}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-blue-100">
                  <p className="text-gray-500">Language</p>
                  <p className="font-semibold text-gray-800">{agentConfig.language}</p>
                </div>
                <div className="bg-white rounded-lg p-2 border border-blue-100 col-span-2">
                  <p className="text-gray-500">Active Hours</p>
                  <p className="font-semibold text-gray-800">{agentConfig.activeHours}</p>
                </div>
              </div>

              {/* Plan Selector */}
              <div className="flex gap-2 mb-3">
                {(['intern', 'agent'] as const).map((plan) => (
                  <div
                    key={plan}
                    className={`flex-1 rounded-lg p-3 border text-center cursor-pointer ${
                      selectedPlan === plan
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className="font-bold text-sm text-gray-900 capitalize">{plan}</p>
                    <p className="text-blue-600 font-bold">₹{PLAN_PRICES[plan].inr}/mo</p>
                    <p className="text-xs text-gray-500">${PLAN_PRICES[plan].usd}/mo</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleQuickDeploy}
                disabled={isDeploying}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isDeploying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deploying your agent...
                  </>
                ) : (
                  <>
                    🚀 Deploy {agentConfig.agentName} — ₹{PLAN_PRICES[selectedPlan].inr}/mo
                  </>
                )}
              </button>
              <p className="text-xs text-center text-gray-500 mt-2">7-day free trial • Cancel anytime • No setup fee</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl p-4">
          {isComplete ? (
            <p className="text-center text-sm text-gray-500">
              Your agent is configured! Click Deploy above to go live. 🎉
            </p>
          ) : (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                disabled={isStreaming}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
              <button
                onClick={sendMessage}
                disabled={isStreaming || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors"
              >
                {isStreaming ? '...' : 'Send'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
