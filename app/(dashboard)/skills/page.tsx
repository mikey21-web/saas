'use client'

import { useState, useMemo } from 'react'
import { Search, Check, Plus, Zap } from 'lucide-react'
import { AGENT_SKILLS, SKILL_CATEGORIES } from '@/lib/agents/agent-skills'

export default function SkillsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [installed, setInstalled] = useState<Set<string>>(
    new Set(['send_whatsapp', 'send_email', 'web_search'])
  )

  const filtered = useMemo(() => {
    return AGENT_SKILLS.filter((skill) => {
      const matchSearch =
        skill.name.toLowerCase().includes(search.toLowerCase()) ||
        skill.description.toLowerCase().includes(search.toLowerCase())
      const matchCat = category === 'all' || skill.category === category
      return matchSearch && matchCat
    })
  }, [search, category])

  const toggle = (id: string) => {
    setInstalled((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalCost = useMemo(() => {
    return [...installed].reduce((total, id) => {
      const skill = AGENT_SKILLS.find((s) => s.id === id)
      return total + (skill?.monthlyPrice || 0)
    }, 0)
  }, [installed])

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: '#e5e5e5' }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 500 }}>
              <Zap size={14} className="inline mr-1" />
              Power Ups
            </span>
          </div>
          <h1
            className="text-3xl font-semibold mb-2"
            style={{ color: '#171717', fontFamily: 'DM Sans, sans-serif' }}
          >
            Skills Marketplace
          </h1>
          <p className="text-base" style={{ color: '#737373' }}>
            Add powerful capabilities to your agents
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className="rounded-xl p-5 border"
            style={{ background: '#ffffff', borderColor: '#e5e5e5' }}
          >
            <p className="text-3xl font-bold" style={{ color: '#171717' }}>
              {AGENT_SKILLS.length}
            </p>
            <p className="text-sm" style={{ color: '#737373' }}>
              Available Skills
            </p>
          </div>
          <div
            className="rounded-xl p-5 border"
            style={{ background: '#ffffff', borderColor: '#e5e5e5' }}
          >
            <p className="text-3xl font-bold" style={{ color: '#22c55e' }}>
              {installed.size}
            </p>
            <p className="text-sm" style={{ color: '#737373' }}>
              Installed
            </p>
          </div>
          <div
            className="rounded-xl p-5 border"
            style={{ background: '#ffffff', borderColor: '#e5e5e5' }}
          >
            <p className="text-3xl font-bold" style={{ color: '#171717' }}>
              ₹{totalCost}
            </p>
            <p className="text-sm" style={{ color: '#737373' }}>
              Monthly Cost
            </p>
          </div>
          <div
            className="rounded-xl p-5 border"
            style={{ background: '#fafafa', borderColor: '#e5e5e5' }}
          >
            <p className="text-3xl font-bold" style={{ color: '#171717' }}>
              15+
            </p>
            <p className="text-sm" style={{ color: '#737373' }}>
              Categories
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div
          className="rounded-xl border p-4"
          style={{ background: '#ffffff', borderColor: '#e5e5e5' }}
        >
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#a3a3a3' }}
              />
              <input
                type="text"
                placeholder="Search skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: '#f5f5f5',
                  border: '1px solid #e5e5e5',
                  color: '#171717',
                }}
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {SKILL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  background: category === cat.id ? '#171717' : '#f5f5f5',
                  color: category === cat.id ? '#ffffff' : '#525252',
                  border: category === cat.id ? 'none' : '1px solid #e5e5e5',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((skill) => (
            <div
              key={skill.id}
              className="rounded-xl border p-5 hover:shadow-lg transition-all"
              style={{ background: '#ffffff', borderColor: '#e5e5e5' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{skill.icon}</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#171717' }}>
                      {skill.name}
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium inline-block mt-1"
                      style={{
                        background: '#dcfce7',
                        color: '#166534',
                      }}
                    >
                      {skill.category}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm mb-4" style={{ color: '#525252', lineHeight: '1.5' }}>
                {skill.description}
              </p>

              <div className="border-t pt-3 mb-3" style={{ borderColor: '#f5f5f5' }}>
                <p className="text-xs mb-2" style={{ color: '#a3a3a3' }}>
                  Features:
                </p>
                <div className="flex flex-wrap gap-1">
                  {skill.features.slice(0, 3).map((feature, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: '#f5f5f5', color: '#525252' }}
                    >
                      {feature}
                    </span>
                  ))}
                  {skill.features.length > 3 && (
                    <span className="text-xs px-2 py-1" style={{ color: '#a3a3a3' }}>
                      +{skill.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: '#22c55e' }}>
                  ₹{skill.monthlyPrice}
                  <span className="text-xs font-normal" style={{ color: '#737373' }}>
                    /mo
                  </span>
                </span>
                <button
                  onClick={() => toggle(skill.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: installed.has(skill.id) ? '#dcfce7' : '#171717',
                    color: installed.has(skill.id) ? '#166534' : '#ffffff',
                  }}
                >
                  {installed.has(skill.id) ? (
                    <>
                      <Check size={14} />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p style={{ color: '#737373', fontSize: '16px' }}>No skills found</p>
            <button
              onClick={() => {
                setCategory('all')
                setSearch('')
              }}
              className="mt-4 text-sm font-medium"
              style={{ color: '#22c55e' }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
