'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 1 | 2 | 3 | 4

export default function CreateAgentWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Business Info
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [products, setProducts] = useState('')

  // Step 2: Knowledge Base
  const [kbMethod, setKbMethod] = useState<'url' | 'manual' | 'upload'>('manual')
  const [kbUrl, setKbUrl] = useState('')
  const [kbText, setKbText] = useState('')

  // Step 3: Personality
  const [agentName, setAgentName] = useState('')
  const [tone, setTone] = useState('professional')
  const [activeHoursStart, setActiveHoursStart] = useState('09')
  const [activeHoursEnd, setActiveHoursEnd] = useState('21')

  // Step 4: Channels
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['whatsapp'])
  const [modelTier, setModelTier] = useState('balanced')

  const industries = [
    'Retail',
    'E-commerce',
    'Healthcare',
    'Education',
    'Finance',
    'Real Estate',
    'Hospitality',
    'SaaS',
    'Other',
  ]

  const handleNext = async () => {
    if (step === 1 && (!businessName || !industry)) {
      alert('Please fill in all fields')
      return
    }
    if (step === 4) {
      // Submit form
      setLoading(true)
      try {
        const response = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: agentName || businessName,
            businessName,
            industry,
            products,
            knowledgeBase: {
              method: kbMethod,
              url: kbUrl,
              content: kbText,
            },
            tone,
            activeHours: { start: activeHoursStart, end: activeHoursEnd },
            channels: selectedChannels,
            modelTier,
          }),
        })

        if (response.ok) {
          const agent = await response.json()
          router.push(`/agents/${agent.id}?success=true`)
        } else {
          alert('Failed to create agent')
        }
      } catch (error) {
        alert('Error creating agent')
        setLoading(false)
      }
      return
    }
    setStep((step + 1) as Step)
  }

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step)
  }

  const canContinue = () => {
    if (step === 1) return businessName && industry
    if (step === 2) return kbMethod === 'manual' || kbUrl || kbText
    if (step === 3) return agentName
    return selectedChannels.length > 0
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600">Step {step} of 4</p>
      </div>

      {/* Step 1: Business Info */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">About Your Business</h2>
          <p className="text-gray-600 mb-6">Help us understand your business context</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Sharma's Dental Clinic"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select industry</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Main Products/Services
              </label>
              <textarea
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                placeholder="e.g., General dentistry, orthodontics, teeth whitening"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Knowledge Base */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Knowledge Base</h2>
          <p className="text-gray-600 mb-6">Teach your agent about your business</p>

          <div className="space-y-4">
            {/* Method Selector */}
            <div className="space-y-3">
              {['manual', 'url', 'upload'].map((method) => (
                <label key={method} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="kb-method"
                    value={method}
                    checked={kbMethod === method}
                    onChange={(e) => setKbMethod(e.target.value as typeof kbMethod)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {method === 'manual' && 'Type FAQs'}
                      {method === 'url' && 'Scrape from Website'}
                      {method === 'upload' && 'Upload PDF/Docs'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {method === 'manual' && 'Enter information manually'}
                      {method === 'url' && 'Automatically extract from your website'}
                      {method === 'upload' && 'Upload your business documents'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Content based on method */}
            {kbMethod === 'manual' && (
              <textarea
                value={kbText}
                onChange={(e) => setKbText(e.target.value)}
                placeholder="Enter FAQs, procedures, policies, or any info your agent should know..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {kbMethod === 'url' && (
              <input
                type="url"
                value={kbUrl}
                onChange={(e) => setKbUrl(e.target.value)}
                placeholder="https://your-website.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {kbMethod === 'upload' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-600">Drag & drop PDFs or docs here</p>
                <input type="file" multiple className="hidden" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Personality */}
      {step === 3 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent Personality</h2>
          <p className="text-gray-600 mb-6">Define how your agent behaves</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Agent Name
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g., Dr. Smile, Support Agent"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Communication Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Active Hours (IST)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={activeHoursStart}
                  onChange={(e) => setActiveHoursStart(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span>to</span>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={activeHoursEnd}
                  onChange={(e) => setActiveHoursEnd(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-sm text-gray-600">(24-hour format)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Default: 9am - 9pm</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Channels & AI Model */}
      {step === 4 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Channels & AI Model</h2>
          <p className="text-gray-600 mb-6">Choose communication channels and AI intelligence</p>

          <div className="space-y-6">
            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Communication Channels
              </label>
              <div className="space-y-2">
                {['whatsapp', 'email', 'sms', 'phone'].map((channel) => (
                  <label key={channel} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(channel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChannels([...selectedChannels, channel])
                        } else {
                          setSelectedChannels(selectedChannels.filter((c) => c !== channel))
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="font-medium text-gray-900">
                      {channel.charAt(0).toUpperCase() + channel.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* AI Model */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                AI Intelligence Level
              </label>
              <div className="space-y-2">
                {[
                  { id: 'fast', name: 'Fast & Free', desc: 'Groq Llama - instant, no cost' },
                  { id: 'balanced', name: 'Balanced', desc: 'Gemini 2.0 Flash - smart & free' },
                  { id: 'smart', name: 'Smartest', desc: 'Claude/GPT - most capable (paid)' },
                ].map((model) => (
                  <label key={model.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${
                    modelTier === model.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="model"
                      value={model.id}
                      checked={modelTier === model.id}
                      onChange={(e) => setModelTier(e.target.value)}
                      className="w-4 h-4 mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{model.name}</p>
                      <p className="text-sm text-gray-600">{model.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className="px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canContinue() || loading}
          className={`flex-1 py-3 rounded-lg font-medium text-white transition-colors ${
            canContinue() && !loading
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {step === 4 ? (loading ? 'Creating...' : 'Deploy Agent') : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
