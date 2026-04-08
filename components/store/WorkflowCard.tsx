'use client'

import { ArrowRight, Star, Users } from 'lucide-react'
import { AgentTemplate } from '@/lib/agents/template-definitions'

// Category color mappings (from competitive analysis)
const CATEGORY_STYLES: Record<
  string,
  {
    gradient: string
    badge: string
    badgeText: string
    accent: string
  }
> = {
  Operations: {
    gradient: 'from-amber-100 to-amber-200',
    badge: 'bg-amber-100',
    badgeText: 'text-amber-700',
    accent: '#F97316',
  },
  Sales: {
    gradient: 'from-blue-100 to-blue-200',
    badge: 'bg-blue-100',
    badgeText: 'text-blue-700',
    accent: '#3B82F6',
  },
  Marketing: {
    gradient: 'from-pink-100 to-pink-200',
    badge: 'bg-pink-100',
    badgeText: 'text-pink-700',
    accent: '#EC4899',
  },
  Finance: {
    gradient: 'from-emerald-100 to-emerald-200',
    badge: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    accent: '#22C55E',
  },
  Healthcare: {
    gradient: 'from-teal-100 to-teal-200',
    badge: 'bg-teal-100',
    badgeText: 'text-teal-700',
    accent: '#14B8A6',
  },
  Support: {
    gradient: 'from-purple-100 to-purple-200',
    badge: 'bg-purple-100',
    badgeText: 'text-purple-700',
    accent: '#8B5CF6',
  },
  Legal: {
    gradient: 'from-slate-100 to-slate-200',
    badge: 'bg-slate-100',
    badgeText: 'text-slate-700',
    accent: '#64748B',
  },
  HR: {
    gradient: 'from-rose-100 to-rose-200',
    badge: 'bg-rose-100',
    badgeText: 'text-rose-700',
    accent: '#F43F5E',
  },
}

// Human names for agents (ActionAgents pattern)
const AGENT_PERSONAS: Record<string, { name: string; role: string; tagline: string }> = {
  'task-master': {
    name: 'Atlas',
    role: 'Task Orchestrator',
    tagline: 'From meeting to done — automatically',
  },
  'lead-catcher': {
    name: 'Scout',
    role: 'Lead Hunter',
    tagline: 'Never let a lead slip through',
  },
  'appoint-bot': {
    name: 'Clara',
    role: 'Appointment Specialist',
    tagline: 'Fill your calendar, not your inbox',
  },
  'follow-up-pro': {
    name: 'Nora',
    role: 'Follow-up Expert',
    tagline: 'Persistence that converts',
  },
  'clinic-guard': {
    name: 'Maya',
    role: 'No-Show Preventer',
    tagline: 'Save patients before they ghost',
  },
  'invoice-bot': {
    name: 'Felix',
    role: 'Billing Specialist',
    tagline: 'Get paid on time, every time',
  },
  'gst-mate': {
    name: 'Vera',
    role: 'GST Compliance Agent',
    tagline: 'Catch compliance before it catches you',
  },
  'support-bot': {
    name: 'Iris',
    role: 'Support Agent',
    tagline: '24/7 support without the headcount',
  },
  'hr-onboard': {
    name: 'Jade',
    role: 'Onboarding Specialist',
    tagline: 'First impressions that stick',
  },
  'contract-review': {
    name: 'Leo',
    role: 'Contract Reviewer',
    tagline: 'Catch the clause before it catches you',
  },
}

// Visual metric badges for hero illustrations
const METRIC_BADGES: Record<string, { value: string; positive: boolean }[]> = {
  'task-master': [
    { value: '+47% productivity', positive: true },
    { value: '2.3h saved/day', positive: true },
  ],
  'lead-catcher': [
    { value: '+32% conversion', positive: true },
    { value: '< 2min response', positive: true },
  ],
  'clinic-guard': [
    { value: '-68% no-shows', positive: true },
    { value: '₹50L+ saved/yr', positive: true },
  ],
  'invoice-bot': [
    { value: '+35% faster payment', positive: true },
    { value: '0 missed invoices', positive: true },
  ],
  'gst-mate': [
    { value: '100% compliant', positive: true },
    { value: '0 penalties', positive: true },
  ],
}

interface WorkflowCardProps {
  template: AgentTemplate
  onDeploy: () => void
}

export function WorkflowCard({ template, onDeploy }: WorkflowCardProps) {
  const styles = CATEGORY_STYLES[template.category] || CATEGORY_STYLES.Operations
  const persona = AGENT_PERSONAS[template.id] || {
    name: template.name,
    role: template.category + ' Agent',
    tagline: template.pain,
  }
  const metrics = METRIC_BADGES[template.id] || []

  return (
    <div
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden
                 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5
                 cursor-pointer"
      onClick={onDeploy}
    >
      {/* Hero Illustration Area */}
      <div className={`relative h-44 bg-gradient-to-br ${styles.gradient} p-5`}>
        {/* Abstract shapes (glass morphism) */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-4 right-4 w-20 h-20 rounded-xl bg-white/40 
                        backdrop-blur-sm rotate-12 opacity-60"
          />
          <div
            className="absolute bottom-6 left-6 w-16 h-16 rounded-lg bg-white/30 
                        backdrop-blur-sm -rotate-6 opacity-50"
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                        w-24 h-24 rounded-2xl bg-white/50 backdrop-blur-sm"
          />
        </div>

        {/* Center Icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <span className="text-5xl drop-shadow-sm">{template.icon}</span>
        </div>

        {/* Metric Badges */}
        {metrics.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 z-10">
            {metrics.map((metric, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold 
                           bg-white/90 backdrop-blur-sm shadow-sm flex items-center gap-1"
                style={{
                  color: metric.positive ? '#059669' : '#DC2626',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: metric.positive ? '#10B981' : '#EF4444',
                  }}
                />
                {metric.value}
              </span>
            ))}
          </div>
        )}

        {/* Multi-Agent Badge */}
        {template.workflow && (
          <span
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] 
                        font-semibold bg-gray-900 text-white z-10"
          >
            Multi-Agent
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5">
        {/* Category Badge */}
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium mb-3 ${styles.badge} ${styles.badgeText}`}
        >
          {template.category}
        </span>

        {/* Agent Name (em-dash format) */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {persona.name} — {persona.role}
        </h3>

        {/* Tagline */}
        <p className="text-sm text-gray-500 mb-3 italic">"{persona.tagline}"</p>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[2.5rem]">
          {template.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-gray-600 font-medium">4.8</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>127</span>
            </span>
          </div>

          {/* Deploy CTA */}
          <span
            className="flex items-center gap-1.5 text-sm font-medium text-gray-900
                        group-hover:text-coral-600 transition-colors"
          >
            Deploy
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  )
}

// Filter pill component
interface FilterPillProps {
  label: string
  count?: number
  active: boolean
  onClick: () => void
}

export function FilterPill({ label, count, active, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
        ${
          active
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-1.5 ${active ? 'text-gray-300' : 'text-gray-400'}`}>
          {count}
        </span>
      )}
    </button>
  )
}
