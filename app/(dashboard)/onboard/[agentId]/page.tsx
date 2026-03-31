'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Script from 'next/script'
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'
import CredentialsStep from '@/components/onboarding/credentials-step'

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

interface AgentCredentials {
  whatsapp_number?: string
  website_url?: string
  openai_api_key?: string
  groq_api_key?: string
  use_diyaa_ai_powered?: boolean
}

const PLAN_PRICES = {
  intern: { inr: 999, usd: 25, label: 'Intern Plan' },
  agent: { inr: 2499, usd: 50, label: 'Agent Plan' },
}

const STEPS = [
  { id: 1, title: 'Smart Interview', desc: 'Tell us about your business' },
  { id: 2, title: 'Knowledge Base', desc: 'Add docs or website (optional)' },
  { id: 3, title: 'Personality', desc: 'Tone, hours, instructions' },
  { id: 4, title: 'Credentials', desc: 'Connect WhatsApp & AI model' },
  { id: 5, title: 'Review & Deploy', desc: 'Ready to launch?' },
]

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

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

export default function OnboardPageMultiStep() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useUser()

  const agentId = params.agentId as string
  const agentName = searchParams.get('name') || agentId
  const agentIcon = searchParams.get('icon') || '🤖'
  const selectedPlan = (searchParams.get('plan') || 'agent') as 'intern' | 'agent'

  // State
  const [currentStep, setCurrentStep] = useState(1)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null)
  const [credentials, setCredentials] = useState<AgentCredentials | null>(null)
  const [knowledgeBase, setKnowledgeBase] = useState('')
  const [personality, setPersonality] = useState({
    tone: 'friendly',
    activeHours: '9:00-21:00',
    language: 'English',
  })
  const [isDeploying, setIsDeploying] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const streamingMessageRef = useRef('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Start interview when step 1 is reached
  useEffect(() => {
    if (currentStep === 1 && messages.length === 0) {
      startInterview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  const streamResponse = useCallback(async (userMessages: Message[]) => {
    setIsStreaming(true)
    streamingMessageRef.current = ''

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
            const parsed = JSON.parse(data) as { token?: string }
            if (parsed.token) {
              streamingMessageRef.current += parsed.token
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: streamingMessageRef.current,
                }
                return updated
              })
            }
          } catch {
            // skip
          }
        }
      }

      const finalText = streamingMessageRef.current
      const config = extractAgentConfig(finalText)
      if (config) {
        setAgentConfig(config)
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
          content: 'Sorry, connection issue. Try again.',
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

    const apiMessages = newMessages.filter(m => m.content.length > 0)
    await streamResponse(apiMessages)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return !!agentConfig
      case 2:
        return true // Knowledge base is optional
      case 3:
        return true // Personality has defaults
      case 4:
        return !!credentials
      case 5:
        return true
      default:
        return false
    }
  }

  const handleCredentialsSubmit = async (creds: AgentCredentials) => {
    setCredentials(creds)
    // Move to review step
    setCurrentStep(5)
  }

  const handleDeploy = async (paymentId?: string) => {
    if (!user || !agentConfig) return
    setIsDeploying(true)

    try {
      const res = await fetch('/api/onboard/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: agentName,
          agentIcon,
          config: {
            ...agentConfig,
            tone: personality.tone,
            activeHours: personality.activeHours,
            language: personality.language,
            keyInstructions: knowledgeBase || agentConfig.keyInstructions,
          },
          credentials, // Include encrypted credentials
          userId: user.id,
          plan: selectedPlan,
          paymentId,
          isFreeTrialat: true,
        }),
      })

      const data = await res.json() as { success?: boolean; agentId?: string; error?: string }

      if (data.success && data.agentId) {
        router.push(
          `/onboard/success?agentId=${data.agentId}&agentName=${encodeURIComponent(data.agentName || 'Agent')}&icon=${encodeURIComponent(agentIcon)}&trial=1`
        )
      } else {
        throw new Error(data.error || 'Deployment failed')
      }
    } catch (err) {
      console.error('Deploy failed:', err)
      alert(`Deploy error: ${String(err)}`)
      setIsDeploying(false)
    }
  }

  const handlePaymentDeploy = async () => {
    if (!user || !agentConfig) return
    setIsDeploying(true)

    if (!razorpayLoaded || !window.Razorpay) {
      await handleDeploy()
      return
    }

    const plan = PLAN_PRICES[selectedPlan]

    const agentRes = await fetch('/api/onboard/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentType: agentName,
        agentIcon,
        config: agentConfig,
        credentials,
        userId: user.id,
        plan: selectedPlan,
        skipPayment: true,
      }),
    })

    const agentData = await agentRes.json() as { success?: boolean; agentId?: string; error?: string }
    if (!agentData.success || !agentData.agentId) {
      setIsDeploying(false)
      alert(`Failed to create agent: ${agentData.error || 'Unknown error'}`)
      return
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: plan.inr * 100,
      currency: 'INR',
      name: 'diyaa.ai',
      description: `${agentConfig.agentName} — ${plan.label}`,
      notes: {
        agentType: agentName,
        userId: user.id,
        plan: selectedPlan,
        agentId: agentData.agentId,
      },
      theme: { color: '#e879f9' },
      handler: async (response: { razorpay_payment_id: string }) => {
        await handleDeploy(response.razorpay_payment_id)
      },
      modal: {
        ondismiss: () => setIsDeploying(false),
      },
    }

    try {
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      await handleDeploy()
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="min-h-screen flex flex-col" style={{ background: '#0c0c0d' }}>
        {/* Step Indicator */}
        <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center gap-2">
              {STEPS.map((step, i) => (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <button
                    onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                    disabled={currentStep < step.id}
                    className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all ${
                      step.id < currentStep
                        ? 'bg-green-600 text-white'
                        : step.id === currentStep
                          ? 'border-2 text-white'
                          : 'opacity-50'
                    }`}
                    style={{
                      borderColor: step.id === currentStep ? '#e879f9' : undefined,
                      background: step.id < currentStep ? '#10b981' : undefined,
                    }}
                  >
                    {step.id < currentStep ? <CheckCircle2 size={20} /> : step.id}
                  </button>

                  {/* Step Label */}
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold" style={{ color: '#f0eff0' }}>
                      {step.title}
                    </p>
                    <p className="text-xs" style={{ color: '#71717a' }}>
                      {step.desc}
                    </p>
                  </div>

                  {/* Connector */}
                  {i < STEPS.length - 1 && (
                    <div
                      className="h-0.5 flex-1 ml-3"
                      style={{
                        background:
                          step.id < currentStep ? '#10b981' : 'rgba(255,255,255,0.1)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 flex flex-col">
          <div className="max-w-4xl mx-auto w-full px-6 py-8 flex-1">
            {/* Step 1: Smart Interview */}
            {currentStep === 1 && (
              <div className="flex flex-col h-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0eff0' }}>
                  Tell Us About Your Business
                </h2>
                <p className="mb-6" style={{ color: '#71717a' }}>
                  Answer a few quick questions so {agentName} understands your business
                </p>

                {/* Chat Area */}
                <div
                  className="flex-1 overflow-y-auto mb-4 p-4 rounded-lg space-y-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                          msg.role === 'user'
                            ? 'rounded-br-none'
                            : 'rounded-bl-none'
                        }`}
                        style={{
                          background:
                            msg.role === 'user'
                              ? '#e879f9'
                              : 'rgba(255,255,255,0.05)',
                          color:
                            msg.role === 'user'
                              ? '#0c0c0d'
                              : '#f0eff0',
                          border:
                            msg.role === 'user'
                              ? 'none'
                              : '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {msg.content || (
                          <span className="flex gap-1">
                            <span
                              className="w-2 h-2 rounded-full animate-bounce"
                              style={{ background: '#e879f9', animationDelay: '0ms' }}
                            />
                            <span
                              className="w-2 h-2 rounded-full animate-bounce"
                              style={{ background: '#e879f9', animationDelay: '150ms' }}
                            />
                            <span
                              className="w-2 h-2 rounded-full animate-bounce"
                              style={{ background: '#e879f9', animationDelay: '300ms' }}
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {!agentConfig && (
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your answer..."
                      disabled={isStreaming}
                      className="flex-1 px-4 py-3 rounded-lg text-sm focus:outline-none disabled:opacity-50"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#f0eff0',
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isStreaming || !input.trim()}
                      className="px-6 py-3 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                      style={{ background: '#e879f9', color: '#0c0c0d' }}
                    >
                      Send
                    </button>
                  </div>
                )}

                {agentConfig && (
                  <div
                    className="p-4 rounded-lg"
                    style={{ background: 'rgba(232,121,249,0.1)' }}
                  >
                    <p className="text-sm font-bold mb-3" style={{ color: '#10b981' }}>
                      ✅ Configuration captured!
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p style={{ color: '#71717a' }}>Business</p>
                        <p style={{ color: '#f0eff0' }} className="font-semibold">
                          {agentConfig.businessName}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#71717a' }}>Industry</p>
                        <p style={{ color: '#f0eff0' }} className="font-semibold">
                          {agentConfig.industry}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Knowledge Base */}
            {currentStep === 2 && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0eff0' }}>
                  Add Knowledge Base (Optional)
                </h2>
                <p className="mb-6" style={{ color: '#71717a' }}>
                  Upload documents, paste FAQs, or scrape your website so {agentName} has context
                </p>

                <div className="space-y-4">
                  <textarea
                    value={knowledgeBase}
                    onChange={(e) => setKnowledgeBase(e.target.value)}
                    placeholder="Paste your FAQs, product info, or instructions here..."
                    className="w-full h-48 px-4 py-3 rounded-lg text-sm focus:outline-none resize-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f0eff0',
                    }}
                  />

                  <p style={{ color: '#71717a' }} className="text-xs">
                    💡 Tip: Add product info, pricing, FAQs, or any knowledge your agent should know
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Personality */}
            {currentStep === 3 && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0eff0' }}>
                    Personality & Behavior
                  </h2>
                  <p style={{ color: '#71717a' }}>
                    Set your agent's tone, working hours, and language
                  </p>
                </div>

                {/* Tone */}
                <div>
                  <label className="block text-sm font-bold mb-3" style={{ color: '#f0eff0' }}>
                    Tone
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['friendly', 'professional', 'casual'].map((tone) => (
                      <button
                        key={tone}
                        onClick={() =>
                          setPersonality({ ...personality, tone })
                        }
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                        style={{
                          background:
                            personality.tone === tone
                              ? '#e879f9'
                              : 'rgba(255,255,255,0.05)',
                          color:
                            personality.tone === tone ? '#0c0c0d' : '#f0eff0',
                          border:
                            personality.tone === tone
                              ? 'none'
                              : '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Hours */}
                <div>
                  <label className="block text-sm font-bold mb-3" style={{ color: '#f0eff0' }}>
                    Active Hours (IST)
                  </label>
                  <input
                    type="text"
                    value={personality.activeHours}
                    onChange={(e) =>
                      setPersonality({ ...personality, activeHours: e.target.value })
                    }
                    placeholder="9:00-21:00"
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f0eff0',
                    }}
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-bold mb-3" style={{ color: '#f0eff0' }}>
                    Language
                  </label>
                  <select
                    value={personality.language}
                    onChange={(e) =>
                      setPersonality({ ...personality, language: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#f0eff0',
                    }}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Hinglish">Hinglish (Auto-detect)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Credentials */}
            {currentStep === 4 && (
              <div className="max-w-2xl">
                <CredentialsStep
                  onCredentialsSubmit={handleCredentialsSubmit}
                  isLoading={false}
                />
              </div>
            )}

            {/* Step 5: Review & Deploy */}
            {currentStep === 5 && (
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#f0eff0' }}>
                  Ready to Deploy!
                </h2>

                {/* Summary Card */}
                <div
                  className="p-6 rounded-lg mb-6 space-y-4"
                  style={{
                    background: 'rgba(232,121,249,0.1)',
                    border: '1px solid rgba(232,121,249,0.3)',
                  }}
                >
                  <div>
                    <p style={{ color: '#71717a' }} className="text-sm mb-1">
                      Agent
                    </p>
                    <p className="text-lg font-bold" style={{ color: '#f0eff0' }}>
                      {agentIcon} {agentName}
                    </p>
                  </div>

                  {agentConfig && (
                    <>
                      <div>
                        <p style={{ color: '#71717a' }} className="text-sm mb-1">
                          Business
                        </p>
                        <p style={{ color: '#f0eff0' }} className="font-semibold">
                          {agentConfig.businessName} ({agentConfig.industry})
                        </p>
                      </div>

                      <div>
                        <p style={{ color: '#71717a' }} className="text-sm mb-1">
                          Personality
                        </p>
                        <p style={{ color: '#f0eff0' }} className="text-sm">
                          {personality.tone} tone • {personality.activeHours} IST •{' '}
                          {personality.language}
                        </p>
                      </div>
                    </>
                  )}

                  {credentials && (
                    <div>
                      <p style={{ color: '#71717a' }} className="text-sm mb-1">
                        Credentials
                      </p>
                      <div className="text-sm space-y-1">
                        {credentials.whatsapp_number && (
                          <p style={{ color: '#10b981' }}>
                            ✓ WhatsApp: {credentials.whatsapp_number}
                          </p>
                        )}
                        {credentials.website_url && (
                          <p style={{ color: '#10b981' }}>
                            ✓ Website configured
                          </p>
                        )}
                        {credentials.use_diyaa_ai_powered && (
                          <p style={{ color: '#10b981' }}>
                            ✓ diyaa.ai Powered AI (₹499/mo extra)
                          </p>
                        )}
                        {credentials.openai_api_key && (
                          <p style={{ color: '#10b981' }}>✓ OpenAI API key set</p>
                        )}
                        {credentials.groq_api_key && (
                          <p style={{ color: '#10b981' }}>✓ Groq API key set</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <p style={{ color: '#71717a' }} className="text-sm mb-1">
                      Plan
                    </p>
                    <p className="text-lg font-bold" style={{ color: '#e879f9' }}>
                      {PLAN_PRICES[selectedPlan].label} — ₹
                      {PLAN_PRICES[selectedPlan].inr}/mo
                    </p>
                  </div>
                </div>

                {/* Deploy Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleDeploy()}
                    disabled={isDeploying}
                    className="w-full py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                    style={{
                      background: '#10b981',
                      color: 'white',
                    }}
                  >
                    {isDeploying ? 'Deploying...' : '✨ Start Free Trial (7 days)'}
                  </button>

                  <button
                    onClick={handlePaymentDeploy}
                    disabled={isDeploying}
                    className="w-full py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                    style={{
                      background: '#e879f9',
                      color: '#0c0c0d',
                    }}
                  >
                    {isDeploying ? '...' : `🚀 Deploy Now — ₹${PLAN_PRICES[selectedPlan].inr}/mo`}
                  </button>
                </div>

                <p style={{ color: '#71717a' }} className="text-xs text-center mt-3">
                  Your credentials are encrypted & never logged • 7-day free trial
                </p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="max-w-4xl mx-auto px-6 py-6 flex gap-3">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="px-6 py-3 rounded-lg font-medium text-sm transition-all disabled:opacity-30 flex items-center gap-2"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: '#f0eff0',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <ChevronLeft size={18} /> Back
              </button>

              <button
                onClick={() =>
                  setCurrentStep(Math.min(STEPS.length, currentStep + 1))
                }
                disabled={!canProceedToNext() || currentStep === STEPS.length}
                className="ml-auto px-6 py-3 rounded-lg font-medium text-sm transition-all disabled:opacity-30 flex items-center gap-2"
                style={{
                  background:
                    canProceedToNext() && currentStep < STEPS.length
                      ? '#e879f9'
                      : 'rgba(255,255,255,0.05)',
                  color:
                    canProceedToNext() && currentStep < STEPS.length
                      ? '#0c0c0d'
                      : '#71717a',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
