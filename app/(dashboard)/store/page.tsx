'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Zap, Sparkles } from 'lucide-react'
import { AGENT_TEMPLATES } from '@/lib/agents/template-definitions'

// Convert templates to agent display format
const agents = AGENT_TEMPLATES.map((template, idx) => ({
  id: idx,
  ...template,
  desc: template.description,
}))

const categories = ['All', ...new Set(agents.map(a => a.category))]

export default function AgentStorePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [deployingId, setDeployingId] = useState<number | null>(null)
  const router = useRouter()

  const handleSmartDeploy = (agent: typeof agents[0]) => {
    if ((agent as any).workflow) {
      // For workflow agents, go directly to workflow execution page
      router.push('/workflows/task-assignment')
    } else {
      router.push(
        `/onboard/${encodeURIComponent(agent.name)}?name=${encodeURIComponent(agent.name)}&icon=${encodeURIComponent(agent.icon)}&plan=agent`
      )
    }
  }

  const handleQuickDeploy = async (agent: typeof agents[0]) => {
    if ((agent as any).workflow) {
      router.push('/workflows/task-assignment')
      return
    }
    setDeployingId(agent.id)
    // Quick deploy: go straight to payment via onboard page with plan pre-selected
    router.push(
      `/onboard/${encodeURIComponent(agent.name)}?name=${encodeURIComponent(agent.name)}&icon=${encodeURIComponent(agent.icon)}&plan=agent&quick=1`
    )
  }

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agent.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agent.targetBusiness.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || agent.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Store</h1>
        <p className="text-gray-600">Choose from 50+ pre-built agents or create your own</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents, use cases, or industries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-sm text-gray-600">
        Found {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}
      </div>

      {/* Agent Cards Grid */}
      {filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow flex flex-col"
            >
              {/* Icon & Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{agent.icon}</div>
                <div className="flex flex-col gap-1 items-end">
                  {(agent as any).badge && (
                    <span className="text-xs font-bold text-white bg-purple-600 px-2 py-1 rounded">
                      {(agent as any).badge}
                    </span>
                  )}
                  <span className="text-xs font-bold text-white bg-gray-400 px-2 py-1 rounded">
                    {agent.category}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-1">{agent.name}</h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-2">{agent.desc}</p>

              {/* Pain Point */}
              <div className="text-xs text-blue-600 font-medium mb-4 p-2 bg-blue-50 rounded">
                💡 {agent.pain}
              </div>

              {/* Features */}
              <div className="mb-4 flex-1">
                <p className="text-xs font-semibold text-gray-700 mb-2">Features:</p>
                <div className="space-y-1">
                  {agent.features.map((feature, i) => (
                    <p key={i} className="text-xs text-gray-600 flex items-center gap-1">
                      <span className="text-green-600">✓</span> {feature}
                    </p>
                  ))}
                </div>
              </div>

              {/* Target */}
              <p className="text-xs text-gray-500 mb-4 italic">For: {agent.targetBusiness}</p>

              {/* Two Deploy Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleQuickDeploy(agent)}
                  disabled={deployingId === agent.id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1"
                  title="Deploy with default settings"
                >
                  <Zap className="w-3 h-3" />
                  1-Click Deploy
                </button>
                <button
                  onClick={() => handleSmartDeploy(agent)}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 py-2 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1"
                  title="Customize for your business with AI interview"
                >
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  Smart Deploy
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-1">Smart Deploy = AI customizes for your business</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No agents found matching your search</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('All')
            }}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-sm text-gray-700 mb-2">
          <strong>Want a custom agent?</strong>
        </p>
        <button
          onClick={() => router.push('/create-agent')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Build your own agent from scratch →
        </button>
      </div>
    </div>
  )
}
