'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, ArrowRight, Check, Loader2 } from 'lucide-react'
import { authFetch } from '@/lib/auth/client'

interface SmartDeployWizardProps {
  agentId: string
  agentName: string
  agentIcon: string
  agentRole?: string
  onComplete: (config: AgentConfig) => void
}

interface AgentConfig {
  businessName: string
  businessDescription: string
  targetCustomers: string
  callToAction: string
  agentName: string
  industry: string
}

// 3-step wizard questions (GeoDo pattern)
const WIZARD_STEPS = [
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

export function SmartDeployWizard({
  agentId,
  agentName,
  agentIcon,
  onComplete,
}: SmartDeployWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamedResponse, setStreamedResponse] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentQuestion = WIZARD_STEPS.find((s) => s.id === currentStep)

  // Focus textarea on step change
  useEffect(() => {
    textareaRef.current?.focus()
  }, [currentStep])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleContinue = useCallback(async () => {
    if (!input.trim() || !currentQuestion) return

    // Save answer
    const newAnswers = { ...answers, [currentQuestion.field]: input.trim() }
    setAnswers(newAnswers)
    setInput('')

    if (currentStep < WIZARD_STEPS.length) {
      // Move to next step
      setCurrentStep(currentStep + 1)
    } else {
      // Final step - generate config with AI
      setIsProcessing(true)
      setStreamedResponse('')

      try {
        // Stream AI response for config generation
        const res = await authFetch('/api/onboard/smart-deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: agentId,
            answers: newAnswers,
          }),
        })

        if (!res.ok) throw new Error('Failed to process')

        if (res.body) {
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let fullResponse = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.token) {
                    fullResponse += parsed.token
                    setStreamedResponse(fullResponse)
                  }
                  if (parsed.config) {
                    // Got final config
                    onComplete(parsed.config)
                    return
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        }

        // Fallback - create config from answers
        const config: AgentConfig = {
          businessName: extractBusinessName(newAnswers.businessDescription || ''),
          businessDescription: newAnswers.businessDescription || '',
          targetCustomers: newAnswers.targetCustomers || '',
          callToAction: newAnswers.callToAction || '',
          agentName: agentName,
          industry: 'General',
        }
        onComplete(config)
      } catch (err) {
        console.error('Smart deploy error:', err)
        // Still complete with basic config
        const config: AgentConfig = {
          businessName: extractBusinessName(newAnswers.businessDescription || ''),
          businessDescription: newAnswers.businessDescription || '',
          targetCustomers: newAnswers.targetCustomers || '',
          callToAction: newAnswers.callToAction || '',
          agentName: agentName,
          industry: 'General',
        }
        onComplete(config)
      } finally {
        setIsProcessing(false)
      }
    }
  }, [input, currentStep, currentQuestion, answers, agentId, agentName, onComplete])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleContinue()
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Agent Avatar */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center text-3xl shadow-lg">
            {agentIcon}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {WIZARD_STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              {/* Dot */}
              <div
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  step.id < currentStep
                    ? 'bg-gray-900'
                    : step.id === currentStep
                      ? 'bg-gray-900'
                      : 'bg-gray-300'
                }`}
              />
              {/* Line */}
              {idx < WIZARD_STEPS.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-1 transition-colors ${
                    step.id < currentStep ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-center gap-12 mb-8 text-xs text-gray-400">
          {WIZARD_STEPS.map((step) => (
            <span
              key={step.id}
              className={step.id === currentStep ? 'text-gray-900 font-medium' : ''}
            >
              Step {step.id}
            </span>
          ))}
        </div>

        {isProcessing ? (
          /* Processing State */
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Loader2 className="w-5 h-5 text-coral-500 animate-spin" />
              <span className="text-gray-600">Setting up your agent...</span>
            </div>
            {streamedResponse && (
              <div className="bg-gray-50 rounded-xl p-4 text-left">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{streamedResponse}</p>
              </div>
            )}
          </div>
        ) : currentQuestion ? (
          /* Question UI */
          <div>
            {/* Question Text */}
            <h2 className="text-lg font-medium text-gray-900 text-center mb-8 max-w-md mx-auto">
              "{currentQuestion.question}"
            </h2>

            {/* Text Area */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentQuestion.placeholder}
                className="w-full min-h-[140px] p-4 pr-12 bg-white border border-gray-200 rounded-xl
                           text-gray-900 placeholder-gray-400 text-sm leading-relaxed
                           focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500
                           resize-none transition-all"
                disabled={isProcessing}
              />
              {/* Voice Input Button */}
              <button
                className="absolute bottom-4 right-4 p-2 rounded-lg bg-gray-100 
                           hover:bg-gray-200 text-gray-500 transition-colors"
                title="Voice input (coming soon)"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>

            {/* Continue Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={handleContinue}
                disabled={!input.trim() || isProcessing}
                className="flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-gray-800
                           disabled:bg-gray-300 disabled:cursor-not-allowed
                           text-white rounded-xl font-medium text-sm transition-colors"
              >
                {currentStep === WIZARD_STEPS.length ? (
                  <>
                    <Check className="w-4 h-4" />
                    Complete Setup
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
            <p className="text-center text-xs text-gray-400 mt-4">
              Press Enter to continue · Shift+Enter for new line
            </p>
          </div>
        ) : null}

        {/* Completed Steps Summary */}
        {Object.keys(answers).length > 0 && !isProcessing && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Your answers</p>
            <div className="space-y-3">
              {WIZARD_STEPS.filter((s) => answers[s.field]).map((step) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{step.question}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{answers[step.field]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper to extract business name from description
function extractBusinessName(description: string): string {
  // Try to find company name patterns
  const patterns = [
    /(?:founder|co-founder|CEO|owner) (?:of|at) ([A-Z][A-Za-z\s]+?)(?:\.|,|$)/i,
    /(?:We're|I'm at|work at|run) ([A-Z][A-Za-z\s]+?)(?:\.|,|$)/i,
    /([A-Z][A-Za-z]+ (?:Labs|Inc|LLC|Corp|Co|Studio|Agency|Consulting|Solutions))/,
  ]

  for (const pattern of patterns) {
    const match = description.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }

  // Fallback
  return 'My Business'
}

export default SmartDeployWizard
