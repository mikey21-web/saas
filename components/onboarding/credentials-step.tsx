'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react'
import {
  validateWhatsAppNumber,
  validateWebsiteUrl,
  validateOpenAIKey,
  validateGroqKey,
  type CredentialValidation,
} from '@/lib/credentials/validators'

interface CredentialsStepProps {
  onCredentialsSubmit: (creds: {
    whatsapp_number?: string
    website_url?: string
    openai_api_key?: string
    groq_api_key?: string
    use_diyaa_ai_powered?: boolean
  }) => Promise<void>
  isLoading?: boolean
}

export default function CredentialsStep({
  onCredentialsSubmit,
  isLoading = false,
}: CredentialsStepProps) {
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [groqKey, setGroqKey] = useState('')
  const [useDiyaaAIPowered, setUseDiyaaAIPowered] = useState(false)

  const [validations, setValidations] = useState<Record<string, CredentialValidation>>({})
  const [validating, setValidating] = useState<Record<string, boolean>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  // Validate on change
  const handleWhatsappChange = (value: string) => {
    setWhatsappNumber(value)
    const validation = validateWhatsAppNumber(value)
    setValidations((prev) => ({ ...prev, whatsapp_number: validation }))
  }

  const handleWebsiteChange = async (value: string) => {
    setWebsiteUrl(value)
    setValidating((prev) => ({ ...prev, website_url: true }))

    const validation = await validateWebsiteUrl(value)
    setValidations((prev) => ({ ...prev, website_url: validation }))
    setValidating((prev) => ({ ...prev, website_url: false }))
  }

  const handleOpenaiChange = (value: string) => {
    setOpenaiKey(value)
    const validation = validateOpenAIKey(value)
    setValidations((prev) => ({ ...prev, openai_api_key: validation }))
  }

  const handleGroqChange = (value: string) => {
    setGroqKey(value)
    const validation = validateGroqKey(value)
    setValidations((prev) => ({ ...prev, groq_api_key: validation }))
  }

  const handleSubmit = async () => {
    await onCredentialsSubmit({
      whatsapp_number: whatsappNumber || undefined,
      website_url: websiteUrl || undefined,
      openai_api_key: openaiKey || undefined,
      groq_api_key: groqKey || undefined,
      use_diyaa_ai_powered: useDiyaaAIPowered,
    })
  }

  const anyKeyProvided = openaiKey || groqKey || useDiyaaAIPowered

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#f0eff0' }}>
          Connect Your Channels
        </h2>
        <p style={{ color: '#71717a' }}>
          Your agent needs these credentials to send messages and search your website for answers.
        </p>
      </div>

      {/* WhatsApp Number */}
      <div className="space-y-3">
        <label className="block" style={{ color: '#f0eff0' }}>
          <span className="font-medium text-sm mb-2 block">WhatsApp Business Number</span>
          <span className="text-xs" style={{ color: '#71717a' }}>
            Your agent will send messages from this number
          </span>
        </label>
        <div className="relative">
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => handleWhatsappChange(e.target.value)}
            placeholder="+919876543210"
            className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none"
            style={{
              borderColor:
                validations.whatsapp_number?.valid === true
                  ? '#10b981'
                  : validations.whatsapp_number?.valid === false
                    ? '#ef4444'
                    : 'rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.15)',
              color: '#f0eff0',
              pointerEvents: 'auto',
              cursor: 'text',
            }}
          />
          {validations.whatsapp_number?.valid && (
            <CheckCircle2 className="absolute right-3 top-3 w-5 h-5" style={{ color: '#10b981' }} />
          )}
          {validations.whatsapp_number?.valid === false && (
            <AlertCircle className="absolute right-3 top-3 w-5 h-5" style={{ color: '#ef4444' }} />
          )}
        </div>
        {validations.whatsapp_number && (
          <div
            className="text-xs p-2 rounded"
            style={{
              background: validations.whatsapp_number.valid
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(239,68,68,0.1)',
              color: validations.whatsapp_number.valid ? '#10b981' : '#ef4444',
            }}
          >
            {validations.whatsapp_number.message}
          </div>
        )}
      </div>

      {/* Website URL */}
      <div className="space-y-3">
        <label className="block" style={{ color: '#f0eff0' }}>
          <span className="font-medium text-sm mb-2 block">Your Website URL</span>
          <span className="text-xs" style={{ color: '#71717a' }}>
            Your agent will search this site for customer questions
          </span>
        </label>
        <div className="relative">
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => handleWebsiteChange(e.target.value)}
            placeholder="https://www.example.com"
            className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none"
            style={{
              borderColor:
                validations.website_url?.valid === true
                  ? '#10b981'
                  : validations.website_url?.valid === false
                    ? '#ef4444'
                    : 'rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.15)',
              color: '#f0eff0',
              pointerEvents: 'auto',
              cursor: 'text',
            }}
          />
          {validating.website_url && (
            <Loader2
              className="absolute right-3 top-3 w-5 h-5 animate-spin"
              style={{ color: '#e879f9' }}
            />
          )}
          {validations.website_url?.valid && !validating.website_url && (
            <CheckCircle2 className="absolute right-3 top-3 w-5 h-5" style={{ color: '#10b981' }} />
          )}
          {validations.website_url?.valid === false && !validating.website_url && (
            <AlertCircle className="absolute right-3 top-3 w-5 h-5" style={{ color: '#ef4444' }} />
          )}
        </div>
        {validations.website_url && (
          <div
            className="text-xs p-2 rounded"
            style={{
              background: validations.website_url.valid
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(239,68,68,0.1)',
              color: validations.website_url.valid ? '#10b981' : '#ef4444',
            }}
          >
            {validations.website_url.message}
          </div>
        )}
      </div>

      {/* AI Model Selection */}
      <div className="space-y-3">
        <label className="block" style={{ color: '#f0eff0' }}>
          <span className="font-medium text-sm mb-4 block">AI Model (What powers your agent)</span>
          <span className="text-xs" style={{ color: '#71717a' }}>
            Choose your AI model for responding to customers
          </span>
        </label>

        {/* Option 1: diyaa.ai Powered */}
        <div
          className="rounded-lg p-4 border cursor-pointer transition-all"
          style={{
            borderColor: useDiyaaAIPowered ? '#e879f9' : 'rgba(255,255,255,0.1)',
            background: useDiyaaAIPowered ? 'rgba(232,121,249,0.1)' : 'rgba(255,255,255,0.02)',
          }}
          onClick={() => {
            setUseDiyaaAIPowered(true)
            setOpenaiKey('')
            setGroqKey('')
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-5 h-5 rounded border mt-1"
              style={{
                borderColor: '#e879f9',
                background: useDiyaaAIPowered ? '#e879f9' : 'transparent',
              }}
            />
            <div className="flex-1">
              <p className="font-semibold" style={{ color: '#f0eff0' }}>
                diyaa.ai Powered (Recommended)
              </p>
              <p className="text-xs mt-1" style={{ color: '#71717a' }}>
                We handle AI, you don't worry about keys. ₹499/month extra.
              </p>
            </div>
          </div>
        </div>

        {/* Option 2: Custom Key */}
        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: '#71717a' }}>
            OR bring your own API key:
          </p>

          {/* OpenAI */}
          <div className="space-y-2">
            <label className="block text-xs" style={{ color: '#71717a' }}>
              OpenAI API Key (optional)
            </label>
            <div className="relative">
              <input
                type={showKeys.openai ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => handleOpenaiChange(e.target.value)}
                placeholder="sk-..."
                disabled={useDiyaaAIPowered}
                className="w-full px-4 py-2 rounded-lg border text-sm transition-all focus:outline-none disabled:opacity-50"
                style={{
                  borderColor:
                    validations.openai_api_key?.valid === true
                      ? '#10b981'
                      : validations.openai_api_key?.valid === false
                        ? '#ef4444'
                        : 'rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#f0eff0',
                }}
              />
              <button
                onClick={() => setShowKeys((prev) => ({ ...prev, openai: !prev.openai }))}
                className="absolute right-3 top-2.5"
                style={{ color: '#71717a' }}
              >
                {showKeys.openai ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {validations.openai_api_key && (
              <div
                className="text-xs"
                style={{ color: validations.openai_api_key.valid ? '#10b981' : '#ef4444' }}
              >
                {validations.openai_api_key.message}
              </div>
            )}
          </div>

          {/* Groq */}
          <div className="space-y-2">
            <label className="block text-xs" style={{ color: '#71717a' }}>
              Groq API Key (free, optional)
            </label>
            <div className="relative">
              <input
                type={showKeys.groq ? 'text' : 'password'}
                value={groqKey}
                onChange={(e) => handleGroqChange(e.target.value)}
                placeholder="gsk_..."
                disabled={useDiyaaAIPowered}
                className="w-full px-4 py-2 rounded-lg border text-sm transition-all focus:outline-none disabled:opacity-50"
                style={{
                  borderColor:
                    validations.groq_api_key?.valid === true
                      ? '#10b981'
                      : validations.groq_api_key?.valid === false
                        ? '#ef4444'
                        : 'rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#f0eff0',
                }}
              />
              <button
                onClick={() => setShowKeys((prev) => ({ ...prev, groq: !prev.groq }))}
                className="absolute right-3 top-2.5"
                style={{ color: '#71717a' }}
              >
                {showKeys.groq ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {validations.groq_api_key && (
              <div
                className="text-xs"
                style={{ color: validations.groq_api_key.valid ? '#10b981' : '#ef4444' }}
              >
                {validations.groq_api_key.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !anyKeyProvided}
        className="w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: '#e879f9', color: '#0c0c0d' }}
      >
        {isLoading && <Loader2 size={16} className="animate-spin" />}
        {isLoading ? 'Setting up...' : 'Continue to Deploy'}
      </button>

      <p className="text-xs text-center" style={{ color: '#71717a' }}>
        ✅ Your credentials are encrypted and never logged. Only used to authenticate your agent.
      </p>
    </div>
  )
}
