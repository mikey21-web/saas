'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Sparkles, Plus, Filter } from 'lucide-react'
import { AGENT_TEMPLATES } from '@/lib/agents/template-definitions'
import { WorkflowCard, FilterPill } from '@/components/store/WorkflowCard'

// Get unique categories with counts
const getCategoriesWithCounts = () => {
  const counts: Record<string, number> = {}
  AGENT_TEMPLATES.forEach((t) => {
    counts[t.category] = (counts[t.category] || 0) + 1
  })
  return [
    { label: 'All', count: AGENT_TEMPLATES.length },
    ...Object.entries(counts).map(([label, count]) => ({ label, count })),
  ]
}

const categories = getCategoriesWithCounts()

export default function AgentStorePage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const filteredAgents = useMemo(() => {
    return AGENT_TEMPLATES.filter((agent) => {
      const matchesCategory =
        selectedCategory === 'All' || agent.category === selectedCategory
      const matchesSearch =
        searchQuery === '' ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.targetBusiness.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  const handleDeploy = (agentId: string, agentName: string, agentIcon: string) => {
    // Use full mode for personalized agent-specific interview
    router.push(
      `/onboard/${encodeURIComponent(agentId)}?name=${encodeURIComponent(agentName)}&icon=${encodeURIComponent(agentIcon)}&plan=agent`
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-coral-500" />
                <span className="text-sm font-medium text-coral-600">
                  AI-Powered Workflows
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Agent Store
              </h1>
              <p className="text-gray-500 mt-1">
                Deploy ready-made AI agents for your business in seconds
              </p>
            </div>
            <button
              onClick={() => router.push('/create-agent')}
              className="flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 
                         text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Build Custom
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-gray-50 
                           border border-gray-200 text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500
                           transition-all"
              />
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400 mr-1" />
              {categories.map((cat) => (
                <FilterPill
                  key={cat.label}
                  label={cat.label}
                  count={cat.count}
                  active={selectedCategory === cat.label}
                  onClick={() => setSelectedCategory(cat.label)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((template) => (
              <WorkflowCard
                key={template.id}
                template={template}
                onDeploy={() => handleDeploy(template.id, template.name, template.icon)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No agents found
            </h2>
            <p className="text-gray-500 text-center max-w-sm mb-6">
              No agents match your search criteria. Try adjusting your filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All')
                setSearchQuery('')
              }}
              className="text-sm font-medium text-coral-600 hover:text-coral-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Custom Agent CTA */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-3">
            Need something custom?
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Build your own multi-agent workflow tailored to your specific business needs
          </p>
          <button
            onClick={() => router.push('/create-agent')}
            className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium 
                       text-sm hover:bg-gray-100 transition-colors"
          >
            Build Custom Agent
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {AGENT_TEMPLATES.length}+
              </p>
              <p className="text-sm text-gray-500">Ready Agents</p>
            </div>
            <div className="w-px h-12 bg-gray-200 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">50+</p>
              <p className="text-sm text-gray-500">Skills</p>
            </div>
            <div className="w-px h-12 bg-gray-200 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-coral-500">₹50L+</p>
              <p className="text-sm text-gray-500">Saved Annually</p>
            </div>
            <div className="w-px h-12 bg-gray-200 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-500">24/7</p>
              <p className="text-sm text-gray-500">Automation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
