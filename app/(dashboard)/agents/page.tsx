'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MessageCircle, Activity, Sparkles, Bot } from 'lucide-react'
import { authFetch, useAuthSession } from '@/lib/auth/client'

interface Agent {
  id: string
  name: string
  template_id: string
  status: string
  icon: string
  business_name: string
  deployed_at: string
}

export default function AgentsPage() {
  const { user, isLoaded } = useAuthSession()
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user) return

    const loadAgents = async () => {
      try {
        const res = await authFetch('/api/agents')

        if (!res.ok) {
          throw new Error('Failed to load agents')
        }

        const data = (await res.json()) as { agents: Agent[] }
        setAgents(data.agents || [])
      } catch (err) {
        console.error('Failed to load agents:', err)
        setAgents([])
      } finally {
        setIsLoading(false)
      }
    }

    loadAgents()
  }, [user, isLoaded])

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-coral-500" />
                <span className="text-sm font-medium text-coral-600">Your Workspace</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Your Agents
              </h1>
              <p className="text-gray-500 mt-1">
                Manage and deploy your AI agents
              </p>
            </div>
            <button
              onClick={() => router.push('/store')}
              className="flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 
                         text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Agent
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {agents.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-coral-50 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-coral-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No agents yet
            </h2>
            <p className="text-gray-500 text-center max-w-sm mb-6">
              Deploy your first AI agent to start automating your business workflows
            </p>
            <button
              onClick={() => router.push('/store')}
              className="flex items-center gap-2 px-6 py-3 bg-coral-500 hover:bg-coral-600 
                         text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Browse Agent Store
            </button>
          </div>
        ) : (
          /* Agent Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() =>
                  router.push(
                    `/office/${agent.id}?name=${encodeURIComponent(agent.name)}&icon=${encodeURIComponent(agent.icon || '🤖')}`
                  )
                }
                className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer 
                           transition-all hover:shadow-lg hover:border-coral-200 hover:-translate-y-0.5 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-coral-100 to-coral-50 
                                  rounded-xl flex items-center justify-center text-2xl
                                  group-hover:scale-105 transition-transform">
                    {agent.icon || '🤖'}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      agent.status === 'active'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {agent.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Info */}
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-coral-600 transition-colors">
                  {agent.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {agent.business_name}
                </p>

                {/* Footer */}
                <div className="flex items-center gap-2 text-xs text-gray-400 pt-4 border-t border-gray-100">
                  <Activity className="w-3.5 h-3.5" />
                  Deployed {new Date(agent.deployed_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {agents.length > 0 && (
        <div className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-center gap-12 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
                <p className="text-sm text-gray-500">Total Agents</p>
              </div>
              <div className="w-px h-10 bg-gray-200 hidden sm:block" />
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-500">
                  {agents.filter((a) => a.status === 'active').length}
                </p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
              <div className="w-px h-10 bg-gray-200 hidden sm:block" />
              <div className="text-center">
                <p className="text-2xl font-bold text-coral-500">24/7</p>
                <p className="text-sm text-gray-500">Automation</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
