'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase/client'
import { MessageCircle, Settings, Zap, BarChart3, Users, Mail, ArrowLeft, Pause, Play, Trash2 } from 'lucide-react'

interface Agent {
  id: string
  user_id: string
  name: string
  business_name: string
  industry: string
  tone: string
  language: string
  status: 'active' | 'paused'
  icon?: string
  active_hours?: string
  monthly_call_limit: number
  monthly_email_limit: number
  monthly_whatsapp_limit: number
  created_at: string
}

interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  whatsapp_consent: boolean
  email_consent: boolean
  sms_consent: boolean
  call_consent: boolean
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const agentId = params.id as string

  const [activeTab, setActiveTab] = useState('chat')
  const [agent, setAgent] = useState<Agent | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!user) return
    loadAgent()
  }, [user, agentId])

  const loadAgent = async () => {
    if (!user) return
    try {
      const { data: agentData, error } = await (supabase as any)
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setAgent(agentData)

      // Load contacts for this agent
      const { data: contactsData } = await (supabase as any)
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)

      if (contactsData) setContacts(contactsData)
    } catch (err) {
      console.error('Failed to load agent:', err)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || !agent || isSending) return

    setIsSending(true)
    const userMessage = { role: 'user' as const, content: inputValue }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    try {
      const res = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          agentId,
          userId: user?.id,
        }),
      })

      if (!res.ok) throw new Error('Failed to send message')
      const data = await res.json() as { response: string }
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had an error processing your message.' }])
    } finally {
      setIsSending(false)
    }
  }

  const toggleAgentStatus = async () => {
    if (!agent) return
    try {
      const newStatus = agent.status === 'active' ? 'paused' : 'active'
      const { error } = await (supabase as any)
        .from('agents')
        .update({ status: newStatus })
        .eq('id', agentId)
        .eq('user_id', user?.id)

      if (error) throw error
      setAgent({ ...agent, status: newStatus })
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  const deleteAgent = async () => {
    if (!agent || !confirm('Are you sure? This cannot be undone.')) return
    try {
      const { error } = await (supabase as any)
        .from('agents')
        .delete()
        .eq('id', agentId)
        .eq('user_id', user?.id)

      if (error) throw error
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to delete agent:', err)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!agent) return <div className="p-8">Agent not found</div>

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'sequences', label: 'Sequences', icon: Zap },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'inbox', label: 'Inbox', icon: Mail },
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{agent.icon || '🤖'}</span>
              <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                agent.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {agent.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">{agent.business_name} • {agent.industry}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAgentStatus}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
          >
            {agent.status === 'active' ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Resume
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-0">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full max-w-4xl mx-auto">
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                  <p>Start a conversation with your agent</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 p-6 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isSending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
                >
                  {isSending ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Agent Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Business Name</label>
                  <p className="text-gray-900 font-medium">{agent.business_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Industry</label>
                  <p className="text-gray-900 font-medium">{agent.industry}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tone</label>
                  <p className="text-gray-900 font-medium capitalize">{agent.tone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Language</label>
                  <p className="text-gray-900 font-medium">{agent.language}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Active Hours</label>
                  <p className="text-gray-900 font-medium">{agent.active_hours || '9:00 AM - 9:00 PM'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Integrations</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <div>
                    <p className="font-medium text-gray-900">WhatsApp</p>
                    <p className="text-xs text-gray-500">Connected</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-xs text-gray-500">Connected</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <div>
                    <p className="font-medium text-gray-900">SMS</p>
                    <p className="text-xs text-gray-500">Coming Soon</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg border border-red-200 p-6">
              <h3 className="font-bold text-red-900 mb-4">Danger Zone</h3>
              <button
                onClick={deleteAgent}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete Agent
              </button>
            </div>
          </div>
        )}

        {/* Sequences Tab */}
        {activeTab === 'sequences' && (
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 font-medium">No sequences configured yet</p>
              <p className="text-gray-500 text-sm mt-2">Create automated workflows for your agent</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                + New Sequence
              </button>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-600">WhatsApp Sent</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-600">Emails Sent</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Usage Limits</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Calls</span>
                      <span className="font-medium">0 / {agent.monthly_call_limit}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Emails</span>
                      <span className="font-medium">0 / {agent.monthly_email_limit}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">WhatsApp</span>
                      <span className="font-medium">0 / {agent.monthly_whatsapp_limit}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
                <p className="text-gray-500 text-sm">No activity yet</p>
              </div>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Agent Contacts</h3>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition">
                + Add Contact
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 font-medium">No contacts yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Phone</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Consent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {contacts.map(contact => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">{contact.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{contact.email || '-'}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{contact.phone || '-'}</td>
                        <td className="px-6 py-3 text-sm">
                          {contact.whatsapp_consent && <span className="text-green-600 font-medium">✓ WhatsApp</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Inbox Tab */}
        {activeTab === 'inbox' && (
          <div className="max-w-4xl mx-auto p-6">
            <h3 className="font-bold text-gray-900 mb-6">Escalated Messages</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 font-medium">No escalated messages</p>
              <p className="text-gray-500 text-sm mt-2">Messages that need human attention will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
