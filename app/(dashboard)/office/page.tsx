'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ArrowRight, Loader2 } from 'lucide-react'
import { authFetch } from '@/lib/auth/client'

interface Agent {
  id: string
  name: string
  agent_type: string
  status: string
  icon?: string
}

interface AgentActivitySummary {
  lastActionAt: string | null
}

// Agent personas mapping
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

export default function OfficePage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [activityByAgentId, setActivityByAgentId] = useState<Record<string, AgentActivitySummary>>({})

  const GRID_ROWS = 3
  const GRID_COLS = 6
  const MAX_SEATS = GRID_ROWS * GRID_COLS
  const seats = Array.from({ length: MAX_SEATS }, (_, idx) => agents[idx] || null)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await authFetch('/api/agents')
        if (res.ok) {
          const data = await res.json()
          setAgents(data.agents || [])
          
          // If only one agent, redirect directly to their office
          if (data.agents?.length === 1) {
            const agent = data.agents[0]
            router.replace(`/office/${agent.id}?name=${encodeURIComponent(agent.name)}&icon=${encodeURIComponent(agent.icon || '🤖')}`)
          }
        }
      } catch (err) {
        console.error('Failed to fetch agents:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
  }, [router])

  // Poll recent activity so tiles glow when agents are working
  useEffect(() => {
    if (!agents.length) return

    let cancelled = false

    const fetchActivity = async () => {
      try {
        const updates: Record<string, AgentActivitySummary> = {}

        await Promise.all(
          agents.map(async (agent) => {
            const res = await authFetch(`/api/agents/${agent.id}/action?agentId=${agent.id}`)
            if (!res.ok) return
            const data = await res.json()
            const actions = (data.actions || []) as { created_at?: string }[]
            if (actions.length && actions[0].created_at) {
              updates[agent.id] = { lastActionAt: actions[0].created_at! }
            }
          })
        )

        if (!cancelled && Object.keys(updates).length) {
          setActivityByAgentId((prev) => ({ ...prev, ...updates }))
        }
      } catch (err) {
        console.error('Failed to fetch office activity:', err)
      }
    }

    fetchActivity()
    const interval = setInterval(fetchActivity, 15000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [agents])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-coral-500 animate-spin" />
          <span className="text-sm text-gray-500">Loading your agents...</span>
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Agents Yet</h2>
          <p className="text-gray-500 mb-6">
            Deploy your first AI agent to access their office and start collaborating.
          </p>
          <button
            onClick={() => router.push('/store')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-coral-500 hover:bg-coral-600 
                       text-white font-medium rounded-xl transition-colors"
          >
            Browse Agent Store
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pixel Office</h1>
        <p className="text-gray-500">
          See all your agents as characters in a shared office, then jump into any command center.
        </p>
      </div>

      {/* Pixel Office Visualization */}
      <div className="mb-8 rounded-3xl border border-gray-200 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 shadow-lg overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/10">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Office floor</p>
            <p className="text-sm text-slate-100">Agents at work right now</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500" /> Idle
            </span>
          </div>
        </div>
        <div className="p-4">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
          >
            {seats.map((seat, idx) => {
              const activity = seat ? activityByAgentId[seat.id] : undefined
              const lastAt = activity?.lastActionAt ? new Date(activity.lastActionAt).getTime() : 0
              const isActive = seat && lastAt && Date.now() - lastAt < 5 * 60 * 1000

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!seat) return
                    const icon = encodeURIComponent(seat.icon || '🤖')
                    const name = encodeURIComponent(seat.name)
                    router.push(`/office/${seat.id}?name=${name}&icon=${icon}`)
                  }}
                  className={`relative aspect-[4/3] rounded-md border transition-colors ${
                    seat
                      ? isActive
                        ? 'border-emerald-400/90 bg-slate-800/80 shadow-[0_0_0_1px_rgba(16,185,129,0.6)] hover:bg-slate-700'
                        : 'border-slate-700 bg-slate-900/80 hover:bg-slate-800'
                      : 'border-slate-900 bg-slate-950'
                  }`}
                >
                  {seat && (
                    <div className="absolute inset-1 flex flex-col justify-between">
                      <div className="flex justify-between text-[10px] text-slate-300">
                        <span className="truncate max-w-[70%]">{seat.name}</span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-400'
                              : seat.status === 'active'
                                ? 'bg-slate-300'
                                : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-coral-400 to-amber-300 flex items-center justify-center text-xs shadow-sm">
                          {seat.icon || '🤖'}
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => {
          const persona = AGENT_PERSONAS[agent.agent_type?.toLowerCase()] || {
            name: agent.name,
            role: 'AI Agent',
          }
          
          return (
            <button
              key={agent.id}
              onClick={() => router.push(`/office/${agent.id}?name=${encodeURIComponent(agent.name)}&icon=${encodeURIComponent(agent.icon || '🤖')}`)}
              className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-2xl
                         hover:border-coral-300 hover:shadow-lg transition-all text-left group"
            >
              {/* Agent Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-coral-100 to-coral-50 
                              flex items-center justify-center text-2xl shrink-0">
                {agent.icon || '🤖'}
              </div>
              
              {/* Agent Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-coral-600 transition-colors">
                  {persona.name} — {agent.name}
                </h3>
                <p className="text-sm text-gray-500">{persona.role}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    agent.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'
                  }`} />
                  <span className="text-xs text-gray-400 capitalize">{agent.status || 'inactive'}</span>
                </div>
              </div>
              
              {/* Arrow */}
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-coral-500 
                                     group-hover:translate-x-1 transition-all" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
