'use client'

import { useState } from 'react'
import { X, CheckCircle2, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { authFetch } from '@/lib/auth/client'

interface CredentialsModalProps {
  agentId: string
  agentType: string
  onClose: () => void
  onSaved?: () => void
}

interface Platform {
  key: string
  name: string
  icon: string
  color: string
  fields: Field[]
  helpUrl: string
  helpText: string
}

interface Field {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'password'
  hint?: string
}

// Platform definitions — each has its own fields
const PLATFORMS: Platform[] = [
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    helpUrl: 'https://www.linkedin.com/developers/apps',
    helpText: 'Create a LinkedIn app and get your access token',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'AQVJ...', type: 'password', hint: 'From LinkedIn Developer Portal → Your App → Auth → Access Token' },
      { key: 'page_id', label: 'LinkedIn Page ID (optional)', placeholder: 'urn:li:organization:12345', type: 'text', hint: 'Your company page URN — leave blank to post as personal profile' },
    ],
  },
  {
    key: 'twitter',
    name: 'Twitter / X',
    icon: '🐦',
    color: '#000000',
    helpUrl: 'https://developer.twitter.com/en/portal/dashboard',
    helpText: 'Create a Twitter Developer app with read/write permissions',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'xvz1evFS...', type: 'password' },
      { key: 'api_secret', label: 'API Secret', placeholder: 'L8qq9PZy...', type: 'password' },
      { key: 'access_token', label: 'Access Token', placeholder: '1234567890-abc...', type: 'password' },
      { key: 'access_token_secret', label: 'Access Token Secret', placeholder: 'AbcDefGhi...', type: 'password' },
    ],
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E1306C',
    helpUrl: 'https://developers.facebook.com/apps',
    helpText: 'Use Facebook Business API to connect Instagram Business account',
    fields: [
      { key: 'access_token', label: 'Page Access Token', placeholder: 'EAABwz...', type: 'password', hint: 'From Facebook Developer Portal → Graph API Explorer' },
      { key: 'instagram_account_id', label: 'Instagram Account ID', placeholder: '17841400...', type: 'text', hint: 'Your Instagram Business Account ID' },
    ],
  },
  {
    key: 'gmail',
    name: 'Gmail',
    icon: '✉️',
    color: '#EA4335',
    helpUrl: 'https://console.cloud.google.com/',
    helpText: 'Enable Gmail API and create OAuth credentials',
    fields: [
      { key: 'client_id', label: 'OAuth Client ID', placeholder: '1234...apps.googleusercontent.com', type: 'text' },
      { key: 'client_secret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-...', type: 'password' },
      { key: 'refresh_token', label: 'Refresh Token', placeholder: '1//04...', type: 'password', hint: 'Run OAuth flow once to get refresh token' },
      { key: 'sender_email', label: 'Sender Email', placeholder: 'you@gmail.com', type: 'text' },
    ],
  },
]

// Which platforms each agent type needs
const AGENT_PLATFORMS: Record<string, string[]> = {
  'social-media-manager': ['linkedin', 'twitter', 'instagram'],
  'email-automator': ['gmail'],
  'emailautomator': ['gmail'],
  'ai-sdr': ['linkedin', 'gmail', 'twitter'],
  'content-marketing': ['linkedin', 'twitter'],
  'competitor-intel': ['twitter'],
}

export default function CredentialsModal({ agentId, agentType, onClose, onSaved }: CredentialsModalProps) {
  const platformKeys = AGENT_PLATFORMS[agentType] || ['linkedin', 'twitter']
  const platforms = PLATFORMS.filter(p => platformKeys.includes(p.key))

  const [activePlatform, setActivePlatform] = useState(platforms[0]?.key || 'linkedin')
  const [values, setValues] = useState<Record<string, Record<string, string>>>({})
  const [showFields, setShowFields] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const currentPlatform = platforms.find(p => p.key === activePlatform)

  const getValue = (platformKey: string, fieldKey: string) =>
    values[platformKey]?.[fieldKey] || ''

  const setValue = (platformKey: string, fieldKey: string, val: string) => {
    setValues(prev => ({
      ...prev,
      [platformKey]: { ...(prev[platformKey] || {}), [fieldKey]: val },
    }))
  }

  const toggleShow = (key: string) => {
    setShowFields(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isPlatformFilled = (platform: Platform) => {
    return platform.fields
      .filter(f => !f.label.includes('optional'))
      .every(f => getValue(platform.key, f.key).trim().length > 0)
  }

  const handleSave = async () => {
    if (!currentPlatform) return
    setSaving(true)
    setError(null)

    try {
      const platformCreds = values[currentPlatform.key] || {}

      // Save to agent metadata via PATCH
      const res = await authFetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            [`${currentPlatform.key}_credentials`]: platformCreds,
          },
        }),
      })

      if (!res.ok) throw new Error('Failed to save credentials')

      setSaved(prev => ({ ...prev, [currentPlatform.key]: true }))
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Connect Channels</h2>
            <p className="text-sm text-gray-500 mt-0.5">Add API keys to enable auto-publishing</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {platforms.map(platform => (
            <button
              key={platform.key}
              onClick={() => setActivePlatform(platform.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activePlatform === platform.key
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span>{platform.icon}</span>
              <span>{platform.name}</span>
              {saved[platform.key] && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          ))}
        </div>

        {/* Platform Content */}
        {currentPlatform && (
          <div className="px-6 py-5 space-y-4">
            {/* Help banner */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-xl">{currentPlatform.icon}</div>
              <div className="flex-1">
                <p className="text-sm text-blue-800">{currentPlatform.helpText}</p>
                <a
                  href={currentPlatform.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium"
                >
                  Get credentials <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Fields */}
            {currentPlatform.fields.map(field => (
              <div key={field.key} className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                {field.hint && (
                  <p className="text-xs text-gray-400">{field.hint}</p>
                )}
                <div className="relative">
                  <input
                    type={field.type === 'password' && !showFields[`${currentPlatform.key}_${field.key}`] ? 'password' : 'text'}
                    value={getValue(currentPlatform.key, field.key)}
                    onChange={e => setValue(currentPlatform.key, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10
                               focus:border-gray-900 transition-all"
                  />
                  {field.type === 'password' && (
                    <button
                      onClick={() => toggleShow(`${currentPlatform.key}_${field.key}`)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showFields[`${currentPlatform.key}_${field.key}`]
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {saved[currentPlatform.key] && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg text-sm">
                <CheckCircle2 className="w-4 h-4" />
                {currentPlatform.name} connected successfully
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">🔒 Encrypted and never logged</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !currentPlatform || !isPlatformFilled(currentPlatform)}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white
                         hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saved[activePlatform] ? 'Update' : 'Connect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
