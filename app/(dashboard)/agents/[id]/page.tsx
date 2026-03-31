'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

interface Agent {
  id: string
  name: string
  icon?: string
  status: string
  template_id: string
  business_name: string
  industry: string
  tone: string
  language: string
  model_tier: string
  channels_whatsapp: boolean
  channels_email: boolean
  channels_sms: boolean
  channels_phone: boolean
  active_hours_start: number
  active_hours_end: number
  monthly_call_limit: number
  monthly_email_limit: number
  monthly_whatsapp_limit: number
  monthly_calls_used: number
  monthly_emails_used: number
  monthly_whatsapp_used: number
  created_at: string
}

export default function AgentDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const agentId = params.id as string
  const isSuccess = searchParams.get('success') === 'true'

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchAgent = async () => {
      if (!user) return
      try {
        const { data, error } = await (supabase
          .from('agents')
          .select('*')
          .eq('id', agentId)
          .eq('user_id', user.id)
          .single()) as any

        if (error) throw error
        setAgent(data as Agent)
      } catch (err) {
        console.error('Failed to fetch agent:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAgent()
  }, [user, agentId])

  const handleCopyLink = () => {
    const agentLink = `${process.env.NEXT_PUBLIC_APP_URL}/agent/${agentId}`
    navigator.clipboard.writeText(agentLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg mb-4">Agent not found</p>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const callsRemaining = agent.monthly_call_limit - agent.monthly_calls_used
  const emailsRemaining = agent.monthly_email_limit - agent.monthly_emails_used
  const whatsappRemaining = agent.monthly_whatsapp_limit - agent.monthly_whatsapp_used

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {isSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✓ Agent deployed successfully! Start using it now.</p>
        </div>
      )}

      {/* Identity Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="text-6xl">{agent.icon || '🤖'}</div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{agent.name}</h1>
              <p className="text-gray-600 text-lg">{agent.business_name}</p>
              <p className="text-sm text-gray-500 mt-1">{agent.industry} • {agent.template_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className={`font-semibold ${agent.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
              {agent.status === 'active' ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-xs text-gray-500 mb-1">Phone</p>
            <p className="font-semibold text-gray-900">+91 XXXXX XXXXX</p>
            <p className="text-xs text-gray-400 mt-1">Coming soon</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-xs text-gray-500 mb-1">Email</p>
            <p className="font-semibold text-gray-900 truncate">info@diyaa.ai</p>
            <p className="text-xs text-gray-400 mt-1">Via Resend</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
            <p className="font-semibold text-gray-900">{agent.channels_whatsapp ? '✓ Active' : '✗ Disabled'}</p>
            <p className="text-xs text-gray-400 mt-1">Official API</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-xs text-gray-500 mb-1">Plan</p>
            <p className="font-semibold text-gray-900 capitalize">{agent.model_tier}</p>
            <p className="text-xs text-gray-400 mt-1">{agent.tone} tone</p>
          </div>
        </div>

        {/* Active Hours & Language */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-xs text-gray-500 mb-2">Active Hours</p>
            <p className="font-semibold text-gray-900">{agent.active_hours_start}:00 - {agent.active_hours_end}:00 IST</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-xs text-gray-500 mb-2">Language</p>
            <p className="font-semibold text-gray-900">{agent.language}</p>
          </div>
        </div>
      </div>

      {/* Usage Meter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📞 Calls/Month</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{agent.monthly_calls_used} / {agent.monthly_call_limit}</span>
                <span className="text-gray-500">{Math.round((agent.monthly_calls_used / agent.monthly_call_limit) * 100)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${Math.min((agent.monthly_calls_used / agent.monthly_call_limit) * 100, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600">{callsRemaining} calls remaining</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">✉️ Emails/Month</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{agent.monthly_emails_used} / {agent.monthly_email_limit}</span>
                <span className="text-gray-500">{Math.round((agent.monthly_emails_used / agent.monthly_email_limit) * 100)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all"
                  style={{ width: `${Math.min((agent.monthly_emails_used / agent.monthly_email_limit) * 100, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600">{emailsRemaining} emails remaining</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">💬 WhatsApp/Month</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{agent.monthly_whatsapp_used} / {agent.monthly_whatsapp_limit}</span>
                <span className="text-gray-500">{agent.monthly_whatsapp_limit > 0 ? Math.round((agent.monthly_whatsapp_used / agent.monthly_whatsapp_limit) * 100) : 0}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all"
                  style={{ width: `${agent.monthly_whatsapp_limit > 0 ? Math.min((agent.monthly_whatsapp_used / agent.monthly_whatsapp_limit) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600">{agent.monthly_whatsapp_limit > 0 ? whatsappRemaining : 'Not included'}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <button
          onClick={handleCopyLink}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          {copied ? '✓ Copied Agent Link' : 'Copy Agent Link'}
        </button>
        <Link
          href={`/agents/${agentId}/settings`}
          className="px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          Settings ⚙️
        </Link>
      </div>
    </div>
  )
}
