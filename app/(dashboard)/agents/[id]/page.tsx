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
    const messageContent = inputValue
    const userMessage = { role: 'user' as const, content: messageContent }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    try {
      // Send to streaming API endpoint
      const res = await fetch(`/api/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          channel: 'whatsapp',
          conversationId: `conv_${agentId}_${Date.now()}`,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

      // Add placeholder for assistant response
      let assistantMessageIndex = -1
      setMessages(prev => {
        assistantMessageIndex = prev.length
        return [...prev, { role: 'assistant', content: '' }]
      })

      // Read the SSE stream
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

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
            const parsed = JSON.parse(data) as { type?: string; content?: string; error?: string }

            if (parsed.type === 'chunk' && parsed.content) {
              fullContent += parsed.content
              // Update the assistant message in real-time
              setMessages(prev => {
                const updated = [...prev]
                if (assistantMessageIndex >= 0) {
                  updated[assistantMessageIndex] = {
                    role: 'assistant',
                    content: fullContent,
                  }
                }
                return updated
              })
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error || 'Unknown error')
            }
          } catch (e) {
            if (e instanceof Error && !e.message.includes('JSON')) {
              throw e
            }
          }
        }
      }

      if (!fullContent) {
        throw new Error('No response from agent')
      }
    } catch (err) {
      console.error('Chat error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response'
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${errorMsg}` }])
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
    <div className="flex flex-col h-screen" style={{ background: '#0c0c0d' }}>
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(22,22,24,0.4)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg transition"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#f0eff0' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{agent.icon || '🤖'}</span>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#f0eff0' }}>{agent.name}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                agent.status === 'active'
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-gray-600/20 text-gray-400'
              }`}>
                {agent.status}
              </span>
            </div>
            <p className="text-sm" style={{ color: '#71717a' }}>{agent.business_name} • {agent.industry}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAgentStatus}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition"
            style={{ background: '#e879f9', color: '#0c0c0d' }}
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
      <div className="border-b px-6" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex gap-0">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
                  isActive
                    ? 'border-b-2'
                    : 'border-transparent'
                }`}
                style={{
                  color: isActive ? '#e879f9' : '#71717a',
                  borderColor: isActive ? '#e879f9' : 'transparent'
                }}
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
                <div className="flex flex-col items-center justify-center h-full" style={{ color: '#71717a' }}>
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
                          ? 'rounded-br-none'
                          : 'rounded-bl-none'
                      }`}
                      style={{
                        background: msg.role === 'user' ? '#e879f9' : 'rgba(255,255,255,0.05)',
                        color: msg.role === 'user' ? '#0c0c0d' : '#f0eff0',
                        border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t p-6" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(22,22,24,0.4)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 transition"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#f0eff0'
                  }}
                  disabled={isSending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isSending}
                  className="px-6 py-2 rounded-lg font-medium transition"
                  style={{
                    background: !inputValue.trim() || isSending ? '#71717a' : '#e879f9',
                    color: !inputValue.trim() || isSending ? '#0c0c0d' : '#0c0c0d'
                  }}
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
            <div className="rounded-lg border p-6" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="font-bold mb-4" style={{ color: '#f0eff0' }}>Agent Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm" style={{ color: '#71717a' }}>Business Name</label>
                  <p className="font-medium" style={{ color: '#f0eff0' }}>{agent.business_name}</p>
                </div>
                <div>
                  <label className="text-sm" style={{ color: '#71717a' }}>Industry</label>
                  <p className="font-medium" style={{ color: '#f0eff0' }}>{agent.industry}</p>
                </div>
                <div>
                  <label className="text-sm" style={{ color: '#71717a' }}>Tone</label>
                  <p className="font-medium" style={{ color: '#f0eff0' }}>
                    {agent.tone.charAt(0).toUpperCase() + agent.tone.slice(1)}
                  </p>
                </div>
                <div>
                  <label className="text-sm" style={{ color: '#71717a' }}>Language</label>
                  <p className="font-medium" style={{ color: '#f0eff0' }}>{agent.language}</p>
                </div>
                <div>
                  <label className="text-sm" style={{ color: '#71717a' }}>Active Hours</label>
                  <p className="font-medium" style={{ color: '#f0eff0' }}>{agent.active_hours || '9:00 AM - 9:00 PM'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-6" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="font-bold mb-4" style={{ color: '#f0eff0' }}>Integrations</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <input type="checkbox" defaultChecked className="w-4 h-4" style={{ accentColor: '#e879f9' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#f0eff0' }}>WhatsApp</p>
                    <p className="text-xs" style={{ color: '#71717a' }}>Connected</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <input type="checkbox" defaultChecked className="w-4 h-4" style={{ accentColor: '#e879f9' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#f0eff0' }}>Email</p>
                    <p className="text-xs" style={{ color: '#71717a' }}>Connected</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                  <input type="checkbox" className="w-4 h-4" style={{ accentColor: '#e879f9' }} disabled />
                  <div>
                    <p className="font-medium" style={{ color: '#f0eff0' }}>SMS</p>
                    <p className="text-xs" style={{ color: '#71717a' }}>Coming Soon</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-lg border p-6" style={{ borderColor: 'rgba(239,71,111,0.3)', background: 'rgba(239,71,111,0.08)' }}>
              <h3 className="font-bold mb-4" style={{ color: '#ff7a8a' }}>Danger Zone</h3>
              <button
                onClick={deleteAgent}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition"
                style={{ background: '#dc2626', color: '#fff' }}
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
            <div className="rounded-lg border p-12 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <Zap className="w-12 h-12 mx-auto mb-4" style={{ color: '#71717a', opacity: 0.5 }} />
              <p className="font-medium" style={{ color: '#f0eff0' }}>No sequences configured yet</p>
              <p className="text-sm mt-2" style={{ color: '#71717a' }}>Create automated workflows for your agent</p>
              <button className="mt-4 px-4 py-2 rounded-lg font-medium transition" style={{ background: '#e879f9', color: '#0c0c0d' }}>
                + New Sequence
              </button>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-6" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-sm" style={{ color: '#71717a' }}>WhatsApp Sent</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#e879f9' }}>0</p>
              </div>
              <div className="rounded-lg border p-6" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-sm" style={{ color: '#71717a' }}>Emails Sent</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#e879f9' }}>0</p>
              </div>
              <div className="rounded-lg border p-6" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-sm" style={{ color: '#71717a' }}>Response Rate</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#e879f9' }}>0%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-lg border p-6" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="font-bold mb-4" style={{ color: '#f0eff0' }}>Usage Limits</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: '#71717a' }}>Calls</span>
                      <span className="font-medium" style={{ color: '#f0eff0' }}>0 / {agent.monthly_call_limit}</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full" style={{ background: '#e879f9', width: '0%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: '#71717a' }}>Emails</span>
                      <span className="font-medium" style={{ color: '#f0eff0' }}>0 / {agent.monthly_email_limit}</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full" style={{ background: '#e879f9', width: '0%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: '#71717a' }}>WhatsApp</span>
                      <span className="font-medium" style={{ color: '#f0eff0' }}>0 / {agent.monthly_whatsapp_limit}</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full" style={{ background: '#e879f9', width: '0%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-6" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <h3 className="font-bold mb-4" style={{ color: '#f0eff0' }}>Recent Activity</h3>
                <p className="text-sm" style={{ color: '#71717a' }}>No activity yet</p>
              </div>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold" style={{ color: '#f0eff0' }}>Agent Contacts</h3>
              <button className="px-4 py-2 rounded-lg font-medium text-sm transition" style={{ background: '#e879f9', color: '#0c0c0d' }}>
                + Add Contact
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="rounded-lg border p-12 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#71717a', opacity: 0.5 }} />
                <p className="font-medium" style={{ color: '#f0eff0' }}>No contacts yet</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <table className="w-full">
                  <thead className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium" style={{ color: '#f0eff0' }}>Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium" style={{ color: '#f0eff0' }}>Email</th>
                      <th className="px-6 py-3 text-left text-sm font-medium" style={{ color: '#f0eff0' }}>Phone</th>
                      <th className="px-6 py-3 text-left text-sm font-medium" style={{ color: '#f0eff0' }}>Consent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    {contacts.map(contact => (
                      <tr key={contact.id} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <td className="px-6 py-3 text-sm" style={{ color: '#f0eff0' }}>{contact.name}</td>
                        <td className="px-6 py-3 text-sm" style={{ color: '#71717a' }}>{contact.email || '-'}</td>
                        <td className="px-6 py-3 text-sm" style={{ color: '#71717a' }}>{contact.phone || '-'}</td>
                        <td className="px-6 py-3 text-sm">
                          {contact.whatsapp_consent && <span className="font-medium" style={{ color: '#10b981' }}>✓ WhatsApp</span>}
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
            <h3 className="font-bold mb-6" style={{ color: '#f0eff0' }}>Escalated Messages</h3>
            <div className="rounded-lg border p-12 text-center" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: '#71717a', opacity: 0.5 }} />
              <p className="font-medium" style={{ color: '#f0eff0' }}>No escalated messages</p>
              <p className="text-sm mt-2" style={{ color: '#71717a' }}>Messages that need human attention will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
