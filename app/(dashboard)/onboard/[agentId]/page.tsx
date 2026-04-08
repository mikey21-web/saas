'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, Sparkles, Mic, Check } from 'lucide-react'
import CredentialsStep from '@/components/onboarding/credentials-step'
import { authFetch, useAuthSession } from '@/lib/auth/client'
import Link from 'next/link'

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

const STEPS = [
  { id: 1, title: 'Configure', desc: 'Tell us about your business' },
  { id: 2, title: 'Knowledge', desc: 'Add docs or FAQs for deeper context' },
  { id: 3, title: 'Personality', desc: 'Refine tone, language, and hours' },
  { id: 4, title: 'Connect', desc: 'Link WhatsApp & AI' },
  { id: 5, title: 'Deploy', desc: 'Ready to launch' },
]

// Quick deploy 3-step wizard questions (GeoDo pattern)
const QUICK_WIZARD_STEPS = [
  {
    id: 1,
    question: 'Tell us your name and a bit about yourself and your company',
    placeholder:
      "I'm Jordan, co-founder of Clarity Labs. We're a 15-person B2B SaaS helping marketing teams track brand mentions and sentiment across social media.",
    field: 'businessDescription',
  },
  {
    id: 2,
    question: 'Who is your ideal customer profile?',
    placeholder:
      'Marketing managers at mid-size companies (50-500 employees) who need real-time brand monitoring and competitive intelligence.',
    field: 'targetCustomers',
  },
  {
    id: 3,
    question: "What's your call to action?",
    placeholder:
      'Book a 15-minute demo call to see how we can help you monitor your brand reputation in real-time.',
    field: 'callToAction',
  },
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
  // Remove any code blocks containing AGENT_CONFIG or JSON-like structures
  let cleaned = text.replace(/```[\s\S]*?AGENT_CONFIG[\s\S]*?```/g, '')
  cleaned = cleaned.replace(/```AGENT_CONFIG[\s\S]*?```/g, '')
  cleaned = cleaned.replace(/```json[\s\S]*?```/g, '')
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '')
  return cleaned.trim()
}

export default function OnboardPageMultiStep() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuthSession()

  const agentId = params.agentId as string
  const agentName = searchParams.get('name') || agentId
  const agentIcon = searchParams.get('icon') || '🤖'
  const selectedPlan = (searchParams.get('plan') || 'agent') as 'intern' | 'agent'
  const mode = searchParams.get('mode') || 'full' // 'quick' for 3-step wizard

  // ==================== QUICK MODE STATE ====================
  const [quickStep, setQuickStep] = useState(1)
  const [quickAnswers, setQuickAnswers] = useState<Record<string, string>>({})
  const [quickInput, setQuickInput] = useState('')
  const [quickProcessing, setQuickProcessing] = useState(false)
  const [quickStatus, setQuickStatus] = useState('')
  const quickTextareaRef = useRef<HTMLTextAreaElement>(null)

  // ==================== FULL MODE STATE ====================
  const [currentStep, setCurrentStep] = useState(1)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null)
  const [credentials, setCredentials] = useState<AgentCredentials | null>(null)
  const [knowledgeBase, setKnowledgeBase] = useState('')
  const [personality, setPersonality] = useState({
    tone: 'professional',
    activeHours: '09:00-21:00',
    language: 'English',
  })
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [_questionCount, setQuestionCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const streamingMessageRef = useRef('')
  const interviewStarted = useRef(false)

  // ==================== QUICK MODE LOGIC ====================

  // Focus textarea on quick step change
  useEffect(() => {
    if (mode === 'quick') {
      quickTextareaRef.current?.focus()
    }
  }, [quickStep, mode])

  // Auto-resize quick textarea
  useEffect(() => {
    if (quickTextareaRef.current) {
      quickTextareaRef.current.style.height = 'auto'
      quickTextareaRef.current.style.height = `${Math.min(quickTextareaRef.current.scrollHeight, 200)}px`
    }
  }, [quickInput])

  const currentQuickQuestion = QUICK_WIZARD_STEPS.find((s) => s.id === quickStep)

  const handleQuickContinue = useCallback(async () => {
    if (!quickInput.trim() || !currentQuickQuestion) return

    const newAnswers = { ...quickAnswers, [currentQuickQuestion.field]: quickInput.trim() }
    setQuickAnswers(newAnswers)
    setQuickInput('')

    if (quickStep < QUICK_WIZARD_STEPS.length) {
      setQuickStep(quickStep + 1)
    } else {
      // Final step - deploy agent
      setQuickProcessing(true)

      try {
        setQuickStatus('Analyzing your business profile...')
        await new Promise((r) => setTimeout(r, 600))

        setQuickStatus('Configuring agent personality...')
        await new Promise((r) => setTimeout(r, 600))

        const businessName = extractQuickBusinessName(newAnswers.businessDescription || '')
        const industry = detectQuickIndustry(newAnswers.businessDescription || '')

        setQuickStatus(`Setting up ${businessName} agent...`)
        await new Promise((r) => setTimeout(r, 400))

        const config: AgentConfig = {
          businessName,
          industry,
          products: '',
          targetCustomers: newAnswers.targetCustomers || '',
          tone: 'professional',
          language: 'English',
          agentPersonality: 'professional',
          activeHours: '09:00-21:00',
          keyInstructions: `Target: ${newAnswers.targetCustomers || ''}\nCTA: ${newAnswers.callToAction || ''}`,
          agentName: `${getQuickPersonaName(agentId)} for ${businessName}`,
        }

        const res = await authFetch('/api/onboard/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: agentName,
            agentIcon,
            config,
            userId: user?.id,
            plan: selectedPlan,
            isFreeTrial: true,
          }),
        })

        const data = (await res.json()) as { success?: boolean; agentId?: string; error?: string }

        if (data.success && data.agentId) {
          setQuickStatus('Success! Redirecting to your agent...')
          await new Promise((r) => setTimeout(r, 500))
          router.push(
            `/office/${data.agentId}?name=${encodeURIComponent(config.agentName)}&icon=${encodeURIComponent(agentIcon)}`
          )
        } else {
          throw new Error(data.error || 'Deployment failed')
        }
      } catch (err) {
        console.error('Quick deploy error:', err)
        setQuickStatus('Deployment failed. Please try again.')
        setQuickProcessing(false)
      }
    }
  }, [quickInput, quickStep, currentQuickQuestion, quickAnswers, agentId, agentName, agentIcon, router, user, selectedPlan])

  const handleQuickBack = () => {
    if (quickStep > 1) {
      setQuickStep(quickStep - 1)
      const prevField = QUICK_WIZARD_STEPS[quickStep - 2]?.field
      if (prevField && quickAnswers[prevField]) {
        setQuickInput(quickAnswers[prevField])
      }
    }
  }

  const handleQuickKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuickContinue()
    }
  }

  // ==================== QUICK MODE RENDER ====================

  if (mode === 'quick') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Back to Store Link */}
        <div className="absolute top-6 left-6">
          <Link
            href="/store"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-xl">
            {/* Agent Avatar */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-coral-400 to-coral-600 
                             flex items-center justify-center text-4xl shadow-xl"
                >
                  {agentIcon}
                </div>
                {!quickProcessing && (
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full 
                               flex items-center justify-center border-2 border-white"
                  >
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Agent Name */}
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">{agentName}</h1>
            <p className="text-sm text-gray-500 text-center mb-8">
              Smart Deploy — 3 quick questions
            </p>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-3 mb-10">
              {QUICK_WIZARD_STEPS.map((step, idx) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 flex items-center justify-center ${
                      step.id < quickStep
                        ? 'bg-emerald-500'
                        : step.id === quickStep
                          ? 'bg-coral-500 scale-125'
                          : 'bg-gray-200'
                    }`}
                  >
                    {step.id < quickStep && <Check className="w-2 h-2 text-white" />}
                  </div>
                  {idx < QUICK_WIZARD_STEPS.length - 1 && (
                    <div
                      className={`w-16 h-0.5 mx-2 transition-colors duration-300 ${
                        step.id < quickStep ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {quickProcessing ? (
              /* Processing State */
              <div className="text-center py-12">
                <div className="flex items-center justify-center gap-3 mb-8">
                  <Loader2 className="w-6 h-6 text-coral-500 animate-spin" />
                </div>
                <p className="text-gray-600 font-medium">{quickStatus}</p>
                <div className="mt-6 max-w-xs mx-auto">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-coral-400 to-coral-600 rounded-full animate-pulse"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>
              </div>
            ) : currentQuickQuestion ? (
              /* Question UI */
              <div>
                {/* Step Label */}
                <p className="text-xs text-gray-400 uppercase tracking-wider text-center mb-4">
                  Step {quickStep} of {QUICK_WIZARD_STEPS.length}
                </p>

                {/* Question Text */}
                <h2 className="text-lg font-medium text-gray-900 text-center mb-8 max-w-md mx-auto leading-relaxed">
                  "{currentQuickQuestion.question}"
                </h2>

                {/* Text Area */}
                <div className="relative">
                  <textarea
                    ref={quickTextareaRef}
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    onKeyDown={handleQuickKeyDown}
                    placeholder={currentQuickQuestion.placeholder}
                    className="w-full min-h-[140px] p-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl
                               text-gray-900 placeholder-gray-400 text-sm leading-relaxed
                               focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500
                               focus:bg-white resize-none transition-all"
                    disabled={quickProcessing}
                  />
                  {/* Voice Input Button */}
                  <button
                    className="absolute bottom-4 right-4 p-2.5 rounded-lg bg-gray-200/80 
                               hover:bg-gray-300 text-gray-500 transition-colors"
                    title="Voice input (coming soon)"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6">
                  {quickStep > 1 ? (
                    <button
                      onClick={handleQuickBack}
                      className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900
                                 rounded-lg text-sm transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    onClick={handleQuickContinue}
                    disabled={!quickInput.trim() || quickProcessing}
                    className="flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-gray-800
                               disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
                               text-white rounded-xl font-medium text-sm transition-all
                               shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30"
                  >
                    {quickStep === QUICK_WIZARD_STEPS.length ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Deploy Agent
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Keyboard Hint */}
                <p className="text-center text-xs text-gray-400 mt-6">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">Enter</kbd> to
                  continue ·{' '}
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                    Shift+Enter
                  </kbd>{' '}
                  for new line
                </p>
              </div>
            ) : null}

            {/* Completed Steps Summary */}
            {Object.keys(quickAnswers).length > 0 && !quickProcessing && (
              <div className="mt-10 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Your answers</p>
                <div className="space-y-4">
                  {QUICK_WIZARD_STEPS.filter((s) => quickAnswers[s.field]).map((step) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">{step.question}</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {quickAnswers[step.field]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 border-t border-gray-100">
          <p className="text-center text-xs text-gray-400">
            Powered by diyaa.ai • Your data is encrypted
          </p>
        </div>
      </div>
    )
  }

  // ==================== FULL MODE LOGIC ====================

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Start interview when step 1 is reached (only once)
  useEffect(() => {
    if (currentStep === 1 && !interviewStarted.current && mode === 'full') {
      interviewStarted.current = true
      startInterview()
    }
  }, [currentStep, mode])

  const streamResponse = useCallback(
    async (userMessages: Message[]) => {
      setIsStreaming(true)
      streamingMessageRef.current = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      try {
        const res = await authFetch('/api/onboard/interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentType: agentName, messages: userMessages }),
        })

        if (!res.ok) {
          const errorText = res.status === 401 ? 'Please sign in again to continue onboarding.' : 'Interview request failed.'
          throw new Error(errorText)
        }

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
                setMessages((prev) => {
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
          setKnowledgeBase(config.keyInstructions || '')
          setPersonality({
            tone: config.tone || 'professional',
            activeHours: config.activeHours || '09:00-21:00',
            language: config.language || 'English',
          })
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: stripConfigBlock(finalText),
            }
            return updated
          })
        }
      } catch (err) {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: err instanceof Error ? err.message : 'Sorry, connection issue. Try again.',
          }
          return updated
        })
      } finally {
        setIsStreaming(false)
        inputRef.current?.focus()
      }
    },
    [agentName]
  )

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
    setQuestionCount((q) => q + 1)

    const apiMessages = newMessages.filter((m) => m.content.length > 0)
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
        return true
      case 3:
        return true
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
    setCurrentStep(5)
  }

  const handleDeploy = async (paymentId?: string) => {
    if (!user || !agentConfig) return
    setIsDeploying(true)

    try {
      const res = await authFetch('/api/onboard/deploy', {
        method: 'POST',
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
          credentials,
          userId: user.id,
          plan: selectedPlan,
          paymentId,
          isFreeTrial: true,
        }),
      })

      const data = (await res.json()) as { success?: boolean; agentId?: string; error?: string }

      if (data.success && data.agentId) {
        router.push(
          `/office/${data.agentId}?name=${encodeURIComponent(agentConfig.agentName || agentName)}&icon=${encodeURIComponent(agentIcon)}`
        )
      } else {
        throw new Error(data.error || 'Deployment failed')
      }
    } catch (err) {
      console.error('Deploy failed:', err)
      setDeployError(`Deploy error: ${String(err)}`)
      setIsDeploying(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center text-2xl shadow-lg">
                {agentIcon}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Deploy {agentName}
                </h1>
                <p className="text-sm text-gray-500">
                  Set up your new AI agent
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {deployError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-red-700">{deployError}</p>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center gap-2">
              {STEPS.map((step, i) => (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                    disabled={currentStep < step.id}
                    className={`w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-all ${
                      step.id <= currentStep 
                        ? 'bg-coral-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step.id < currentStep ? <CheckCircle2 size={16} /> : step.id}
                  </button>
                  <div className="ml-2 flex-1">
                    <p className={`text-sm font-medium ${
                      step.id === currentStep ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-2 ${
                      step.id < currentStep ? 'bg-coral-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Step 1: Configuration Interview */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900">
                Tell us about your business
              </h2>
              <p className="text-sm mb-6 text-gray-500">
                Answer a few questions to configure {agentName} for your needs
              </p>

              {/* Chat */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                        msg.role === 'user' 
                          ? 'bg-coral-500 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.content || (
                        <div className="flex gap-1 items-center h-5">
                          <span className="w-1.5 h-1.5 rounded-full bg-coral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-coral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-coral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
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
                    className="flex-1 px-4 py-3 rounded-xl text-sm bg-white border border-gray-200 text-gray-900 
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isStreaming || !input.trim()}
                    className="px-6 py-3 rounded-xl font-medium text-sm bg-coral-500 hover:bg-coral-600 
                               disabled:bg-gray-200 disabled:text-gray-400 text-white transition-colors"
                  >
                    Send
                  </button>
                </div>
              )}

              {agentConfig && (
                <>
                  <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-200 mb-6">
                    <p className="text-sm font-medium mb-2 text-emerald-700">
                      ✓ Configuration captured
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Business</p>
                        <p className="text-gray-900 font-medium">{agentConfig.businessName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Industry</p>
                        <p className="text-gray-900 font-medium">{agentConfig.industry}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="w-full py-3 rounded-xl font-medium text-sm bg-coral-500 hover:bg-coral-600 text-white transition-colors"
                  >
                    Continue to Step 2
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 2: Knowledge Base */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900">
                Knowledge Base (Optional)
              </h2>
              <p className="text-sm mb-6 text-gray-500">
                Already captured from interview. Add extra FAQs/docs only if needed.
              </p>
              <textarea
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder="Paste FAQs, product info, or instructions..."
                className="w-full h-48 px-4 py-3 rounded-xl text-sm resize-none bg-white border border-gray-200
                           text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-3 rounded-xl font-medium text-sm border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 py-3 rounded-xl font-medium text-sm bg-coral-500 hover:bg-coral-600 text-white transition-colors"
                >
                  Continue to Step 3
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Personality */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900">
                Timing
              </h2>
              <p className="text-sm mb-6 text-gray-500">
                Set your working hours for when the agent should be active.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm mb-2 block text-gray-600">
                    Working Hours
                  </label>
                  <input
                    type="text"
                    value={personality.activeHours}
                    onChange={(e) =>
                      setPersonality({ ...personality, activeHours: e.target.value })
                    }
                    placeholder="09:00-21:00"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900
                               focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 py-3 rounded-xl font-medium text-sm border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 py-3 rounded-xl font-medium text-sm bg-coral-500 hover:bg-coral-600 text-white transition-colors"
                >
                  Continue to Step 4
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Credentials */}
          {currentStep === 4 && (
            <CredentialsStep
              onCredentialsSubmit={handleCredentialsSubmit}
              isLoading={isDeploying}
            />
          )}

          {/* Step 5: Review & Deploy */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-900">
                Review & Deploy
              </h2>
              <p className="text-sm mb-6 text-gray-500">
                Confirm your configuration
              </p>

              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral-100 to-coral-50 flex items-center justify-center text-xl">
                      {agentIcon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {agentConfig?.agentName || agentName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {agentName}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-600 font-medium">
                    Ready
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Business</p>
                    <p className="text-gray-900 font-medium">{agentConfig?.businessName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Industry</p>
                    <p className="text-gray-900 font-medium">{agentConfig?.industry || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tone</p>
                    <p className="text-gray-900 font-medium">{personality.tone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Hours</p>
                    <p className="text-gray-900 font-medium">{personality.activeHours}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeploy()}
                disabled={isDeploying}
                className="w-full mt-6 py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 
                           bg-coral-500 hover:bg-coral-600 disabled:bg-gray-200 disabled:text-gray-400 
                           text-white transition-colors shadow-lg shadow-coral-500/20"
              >
                {isDeploying ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Deploy Agent (Free Trial)
              </button>
            </div>
          )}

          {/* Navigation */}
          {currentStep < 5 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                disabled={currentStep === 1}
                className="px-6 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 
                           disabled:text-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                disabled={!canProceedToNext()}
                className={`px-8 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                  canProceedToNext()
                    ? 'bg-coral-500 hover:bg-coral-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ==================== QUICK MODE HELPER FUNCTIONS ====================

function extractQuickBusinessName(description: string): string {
  const patterns = [
    /(?:founder|co-founder|CEO|owner|run|head) (?:of|at) ([A-Z][A-Za-z\s]+?)(?:\.|,|$)/i,
    /(?:We're|I'm at|work at|from) ([A-Z][A-Za-z\s]+?)(?:\.|,|$)/i,
    /([A-Z][A-Za-z]+ (?:Labs|Inc|LLC|Corp|Co|Studio|Agency|Consulting|Solutions|Tech|AI))/,
    /company[:\s]+([A-Z][A-Za-z\s]+?)(?:\.|,|$)/i,
  ]

  for (const pattern of patterns) {
    const match = description.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return 'My Business'
}

function detectQuickIndustry(description: string): string {
  const lowerDesc = description.toLowerCase()

  const industries: Record<string, string[]> = {
    'SaaS / Technology': ['saas', 'software', 'tech', 'ai', 'machine learning', 'app', 'platform'],
    'E-commerce / Retail': ['ecommerce', 'e-commerce', 'retail', 'shop', 'store', 'products'],
    Healthcare: ['clinic', 'hospital', 'doctor', 'medical', 'health', 'patient'],
    'Finance / Consulting': ['consulting', 'advisory', 'finance', 'accounting', 'legal', 'ca '],
    'Marketing / Agency': ['marketing', 'agency', 'advertising', 'brand', 'social media'],
  }

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some((kw) => lowerDesc.includes(kw))) {
      return industry
    }
  }

  return 'General Business'
}

function getQuickPersonaName(agentType: string): string {
  const personas: Record<string, string> = {
    'task-master': 'Atlas',
    taskmaster: 'Atlas',
    'lead-catcher': 'Scout',
    leadcatcher: 'Scout',
    'clinic-guard': 'Maya',
    clinicguard: 'Maya',
    'invoice-bot': 'Felix',
    invoicebot: 'Felix',
    'gst-mate': 'Vera',
    gstmate: 'Vera',
    appointbot: 'Kai',
    salescloser: 'Max',
    leadintent: 'Nova',
    conversationintel: 'Aria',
  }

  const key = agentType.toLowerCase().replace(/[\s-]/g, '')
  return personas[key] || 'Agent'
}
