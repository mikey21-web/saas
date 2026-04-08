'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import {
  Send,
  Bot,
  User,
  MoreVertical,
  Phone,
  Mail,
  MessageSquare,
  Settings,
  ArrowLeft,
  Mic,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Plus,
  Inbox,
  BarChart3,
  Users,
  FileText,
  Workflow,
  TrendingUp,
} from 'lucide-react'
import { authFetch } from '@/lib/auth/client'
import CredentialsModal from '@/components/office/CredentialsModal'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

interface QuickAction {
  label: string
  description: string
  icon: string
  action: string
}

interface DashboardConfig {
  dashboard?: {
    quickActions?: QuickAction[]
  }
  ui?: {
    quickActions?: string[]
  }
}

interface AgentRecord {
  id: string
  name: string
  agent_type: string
  business_name: string
  description: string
  channels_whatsapp: boolean
  channels_email: boolean
  channels_phone: boolean
  status: string
  icon?: string
}

interface AgentActionRecord {
  id: string
  agent_id: string
  action_type: string
  action_params?: Record<string, any> | null
  result?: Record<string, any> | null
  created_at: string
}

// Agent personas mapping (same as WorkflowCard)
const AGENT_PERSONAS: Record<string, { name: string; role: string }> = {
  teamexecutor: { name: 'Atlas', role: 'Task Orchestrator' },
  leadcatcher: { name: 'Scout', role: 'Lead Hunter' },
  appointbot: { name: 'Clara', role: 'Appointment Specialist' },
  followuppro: { name: 'Nora', role: 'Follow-up Expert' },
  clinicguard: { name: 'Maya', role: 'No-Show Preventer' },
  invoicebot: { name: 'Felix', role: 'Billing Specialist' },
  gstmate: { name: 'Vera', role: 'GST Compliance Agent' },
  supportbot: { name: 'Iris', role: 'Support Agent' },
  hronboard: { name: 'Jade', role: 'Onboarding Specialist' },
  contractreview: { name: 'Leo', role: 'Contract Reviewer' },
}

type ActivityFilter = 'all' | 'tasks' | 'messages'

function getActivityColor(actionType: string): string {
  if (actionType === 'create_task' || actionType === 'generate_report') return 'bg-emerald-400'
  if (actionType === 'send_email') return 'bg-blue-400'
  if (actionType === 'send_whatsapp' || actionType === 'send_sms') return 'bg-yellow-400'
  return 'bg-gray-300'
}

function buildActivityTitle(action: AgentActionRecord): string {
  const params = action.action_params || {}
  switch (action.action_type) {
    case 'send_whatsapp':
      return `WhatsApp to ${params.to || 'contact'}`
    case 'send_email':
      return `Email to ${params.to || 'recipient'}`
    case 'send_sms':
      return `SMS to ${params.to || 'contact'}`
    case 'create_task':
      return `Task "${params.title || 'New task'}" created`
    case 'generate_report':
      return `${(params.type as string) || 'Report'} generated`
    default:
      return `Action: ${action.action_type}`
  }
}

function buildActivitySubtitle(action: AgentActionRecord): string {
  const params = action.action_params || {}
  const result = action.result || {}
  switch (action.action_type) {
    case 'send_whatsapp':
    case 'send_sms':
      return String(params.message || result.message || '').slice(0, 80) || 'Notification sent'
    case 'send_email':
      return (
        (params.subject as string) ||
        String(params.message || result.message || '').slice(0, 80) ||
        'Email sent'
      )
    case 'create_task':
      return (params.assignee as string) || (result.message as string) || 'Created in task list'
    case 'generate_report':
      return (result.type as string) || 'Automation report generated'
    default:
      return (result.message as string) || 'Agent action logged'
  }
}

function formatTimeAgo(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? '' : 's'} ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
}

export default function AgentOfficePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const agentId = params.agentId as string
  const agentNameParam = searchParams.get('name')
  const agentIconParam = searchParams.get('icon')

  // State
  const [agent, setAgent] = useState<AgentRecord | null>(null)
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sendingError, setSendingError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [activity, setActivity] = useState<AgentActionRecord[]>([])
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all')
  const [activityLoading, setActivityLoading] = useState(false)
  const [stats, setStats] = useState<{ total: number; successful: number; today: number; avgDuration: number } | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load agent data and config
  useEffect(() => {
    const loadAgentData = async () => {
      try {
        setIsLoading(true)
        const agentRes = await authFetch(`/api/agents/${agentId}`)
        if (!agentRes.ok) throw new Error('Failed to load agent')
        const { agent: agentData } = await agentRes.json()
        setAgent(agentData)

        const configRes = await authFetch(
          `/api/agents/${agentId}/dashboard-config?agentType=${agentData.agent_type}`
        )
        if (configRes.ok) {
          const config = await configRes.json()
          setDashboardConfig(config)
        }

        // Load real stats
        try {
          const statsRes = await authFetch(`/api/agents/${agentId}/stats`)
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            setStats(statsData)
          }
        } catch {
          // stats are non-critical
        }

        // Get persona for greeting
        const persona = AGENT_PERSONAS[agentData.agent_type] || { name: agentData.name, role: 'Agent' }
        
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: `Hi! I'm ${persona.name}, your ${persona.role}. I'm here to help with ${agentData.business_name}. What would you like me to do?`,
            timestamp: new Date(),
            status: 'sent',
          },
        ])
      } catch (err) {
        console.error('Failed to load agent:', err)
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: 'Failed to load agent. Please refresh and try again.',
            timestamp: new Date(),
            status: 'error',
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    if (agentId) {
      loadAgentData()
    }
  }, [agentId])

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !agent) return

    setSendingError(null)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      status: 'sending',
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const res = await authFetch(`/api/agents/${agentId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: agent.agent_type,
          message: input,
          channel: 'api',
        }),
      })

      if (!res.ok) throw new Error(`API error: ${res.statusText}`)

      const data = await res.json()
      let reply = data?.result?.message || data?.message || 'I processed your request.'

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        status: 'sent',
      }

      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === userMessage.id ? { ...m, status: 'sent' as const } : m
        )
        return [...updated, assistantMessage]
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setSendingError(errorMsg)
      setMessages((prev) => [
        ...prev.map((m) =>
          m.id === userMessage.id ? { ...m, status: 'error' as const } : m
        ),
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `Sorry, I ran into an issue: ${errorMsg}. Please try again.`,
          timestamp: new Date(),
          status: 'error',
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [agent, agentId, input])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // Get display values
  const persona = agent ? AGENT_PERSONAS[agent.agent_type] : null
  const displayName = persona?.name || agent?.name || agentNameParam || 'Agent'
  const displayRole = persona?.role || agent?.agent_type || 'AI Agent'
  const displayIcon = agent?.icon || agentIconParam || '🤖'

  // Quick actions from config
  const quickActions = dashboardConfig?.dashboard?.quickActions || [
    { label: 'Send summary', icon: '📊', action: 'summary', description: '' },
    { label: 'Check status', icon: '🔍', action: 'status', description: '' },
    { label: 'Send reminder', icon: '⏰', action: 'reminder', description: '' },
  ]

  // Suggested prompts
  const suggestedPrompts = dashboardConfig?.ui?.quickActions?.slice(0, 3) || [
    'Send daily report',
    'Check pending tasks',
    'Remind about payment',
  ]

  // Activity feed
  useEffect(() => {
    if (!agentId) return

    let cancelled = false

    const loadActivity = async () => {
      try {
        setActivityLoading(true)
        const res = await authFetch(`/api/agents/${agentId}/action?agentId=${agentId}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setActivity((data.actions || []) as AgentActionRecord[])
        }
      } catch (err) {
        console.error('Failed to load agent activity:', err)
      } finally {
        if (!cancelled) {
          setActivityLoading(false)
        }
      }
    }

    loadActivity()
    const interval = setInterval(loadActivity, 15000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [agentId])

  const filteredActivity = activity.filter((action) => {
    if (activityFilter === 'tasks') {
      return action.action_type === 'create_task' || action.action_type === 'generate_report'
    }
    if (activityFilter === 'messages') {
      return (
        action.action_type === 'send_whatsapp' ||
        action.action_type === 'send_sms' ||
        action.action_type === 'send_email'
      )
    }
    return true
  })

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading agent workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Dark Nested Sidebar (ActionAgents Pattern) */}
      <div className="w-64 bg-gray-900 flex flex-col">
        {/* Agent Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-coral-400 to-coral-600 flex items-center justify-center text-2xl">
              {displayIcon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-white truncate">{displayName}</h2>
              <p className="text-xs text-gray-400 truncate">{displayRole}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
          </div>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            <SidebarItem icon={MessageSquare} label="Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
            <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setShowCredentials(true)} />
            <SidebarItem icon={Workflow} label="Sequences" active={activeTab === 'sequences'} onClick={() => setActiveTab('sequences')} />
            <SidebarItem icon={Inbox} label="Agent Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
            <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Users} label="Contacts" active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} />
            <SidebarItem icon={FileText} label="Researcher" active={activeTab === 'researcher'} onClick={() => setActiveTab('researcher')} />
          </div>
          <div className="mt-6">
            <p className="px-3 mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Recent</p>
            <div className="space-y-1">
              {activity.slice(0, 3).map((item) => (
                <RecentChat key={item.id} title={buildActivityTitle(item)} time={formatTimeAgo(item.created_at)} />
              ))}
              {activity.length === 0 && (
                <p className="px-3 text-[11px] text-gray-600">No recent activity</p>
              )}
            </div>
          </div>
        </nav>

        {/* Channel Status */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Channels</p>
          <div className="space-y-2">
            <ChannelStatus icon={MessageSquare} label="WhatsApp" connected={agent?.channels_whatsapp} />
            <ChannelStatus icon={Mail} label="Email" connected={agent?.channels_email} />
            <ChannelStatus icon={Phone} label="Voice" connected={agent?.channels_phone} />
          </div>
        </div>
      </div>

      {/* Main Area: Chat + Activity */}
      <div className="flex-1 flex bg-gray-50">
        {/* Chat Column */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-5">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/agents')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="font-medium text-gray-900">{agent?.business_name || displayName}</h1>
                <p className="text-xs text-gray-500">{displayRole} · Command Center</p>
              </div>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Value Metrics */}
          <div className="border-b border-gray-100 bg-white">
            <div className="max-w-3xl mx-auto px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-coral-50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-coral-500" />
                </div>
                <div>
                  <p className="text-gray-400">This month</p>
                  <p className="font-semibold text-gray-900">{stats ? `${stats.total} runs` : '0 runs'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-gray-400">Successful</p>
                  <p className="font-semibold text-gray-900">{stats ? `${stats.successful} succeeded` : '0 succeeded'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-400">Today</p>
                  <p className="font-semibold text-gray-900">{stats ? `${stats.today} today` : '0 today'}</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-400">Channels</p>
                  <p className="font-semibold text-gray-900">
                    {[
                      agent?.channels_whatsapp ? 'WhatsApp' : '',
                      agent?.channels_email ? 'Email' : '',
                      agent?.channels_phone ? 'Voice' : '',
                    ].filter(Boolean).join(' · ') || 'Connect channels'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {!!quickActions.length && (
            <div className="border-b border-gray-100 bg-white">
              <div className="max-w-3xl mx-auto px-5 py-3 flex gap-2 overflow-x-auto">
                {quickActions.map((qa) => (
                  <button
                    key={qa.action}
                    onClick={() => setInput(qa.label)}
                    className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 hover:border-coral-300 whitespace-nowrap transition-colors"
                  >
                    <span className="mr-1">{qa.icon}</span>
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-coral-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-coral-500 text-white rounded-br-md shadow-sm'
                          : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1.5 text-xs text-gray-400 ${message.role === 'user' ? 'justify-end' : ''}`}>
                      <span>{formatTime(message.timestamp)}</span>
                      {message.role === 'user' && (
                        message.status === 'sending' ? (
                          <Clock className="w-3 h-3" />
                        ) : message.status === 'sent' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )
                      )}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-coral-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggested Prompts */}
          {messages.length <= 2 && (
            <div className="px-6 pb-2">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-coral-500" />
                  <span className="text-xs font-medium text-coral-600">Suggested</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(prompt)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="max-w-3xl mx-auto">
              {sendingError && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                  {sendingError}
                </div>
              )}
              <div className="flex items-end gap-3 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:border-coral-500 focus-within:ring-2 focus-within:ring-coral-500/20 transition-all">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={`Message ${displayName}...`}
                  className="flex-1 py-2 px-2 bg-transparent outline-none resize-none text-sm text-gray-900 placeholder-gray-400 min-h-[24px] max-h-32"
                  rows={1}
                  disabled={isTyping}
                />
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors" title="Voice input">
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isTyping}
                    className="p-2 bg-coral-500 hover:bg-coral-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        </div>

        {/* Activity Column (Desktop) */}
        <aside className="hidden xl:flex w-80 border-l border-gray-200 bg-white flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Activity</p>
              <p className="text-sm text-gray-900">Today</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-600">Live</span>
          </div>
          <div className="px-5 py-3 flex gap-2 text-xs text-gray-500 border-b border-gray-100">
            <button
              className={`px-2 py-1 rounded-full ${activityFilter === 'all' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActivityFilter('all')}
            >
              All
            </button>
            <button
              className={`px-2 py-1 rounded-full ${activityFilter === 'tasks' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActivityFilter('tasks')}
            >
              Tasks
            </button>
            <button
              className={`px-2 py-1 rounded-full ${activityFilter === 'messages' ? 'bg-gray-900 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActivityFilter('messages')}
            >
              Messages
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-xs">
            {activityLoading && !activity.length && (
              <div className="text-[11px] text-gray-400">Loading recent activity…</div>
            )}
            {!activityLoading && !activity.length && (
              <div className="text-[11px] text-gray-400">No recent activity yet.</div>
            )}
            {filteredActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <div className={`mt-0.5 w-1 h-8 rounded-full ${getActivityColor(item.action_type)}`} />
                <div>
                  <p className="text-gray-900 font-medium">{buildActivityTitle(item)}</p>
                  <p className="text-gray-500">{buildActivitySubtitle(item)}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatTimeAgo(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
      {showCredentials && agent && (
        <CredentialsModal
          agentId={agentId}
          agentType={agent.agent_type}
          onClose={() => setShowCredentials(false)}
          onSaved={() => {
            setShowCredentials(false)
          }}
        />
      )}
    </div>
  )
}

// Sidebar Item Component
function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-gray-800 text-white'
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 bg-coral-500 text-white text-[10px] font-semibold rounded-full">
          {badge}
        </span>
      )}
    </button>
  )
}

// Recent Chat Component
function RecentChat({ title, time }: { title: string; time: string }) {
  return (
    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 transition-colors group">
      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="flex-1 text-left truncate">{title}</span>
      <span className="text-[10px] text-gray-600 group-hover:text-gray-500">{time}</span>
    </button>
  )
}

// Channel Status Component
function ChannelStatus({
  icon: Icon,
  label,
  connected,
}: {
  icon: React.ElementType
  label: string
  connected?: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={`w-4 h-4 ${connected ? 'text-emerald-500' : 'text-gray-600'}`} />
      <span className="text-gray-400">{label}</span>
      <span className={`ml-auto text-[10px] ${connected ? 'text-emerald-500' : 'text-gray-600'}`}>
        {connected ? '● Connected' : '○ Not set'}
      </span>
    </div>
  )
}
