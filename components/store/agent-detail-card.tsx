'use client'

import { ChevronLeft, Zap, Sparkles } from 'lucide-react'
import { getAgentDetails } from '@/lib/agents/agent-details'
import { getTemplate } from '@/lib/agents/template-definitions'

interface AgentDetailCardProps {
  agentId: string
  onBack: () => void
  onSmartDeploy: () => void
  onQuickDeploy: () => void
  isDeploying?: boolean
}

export default function AgentDetailCard({
  agentId,
  onBack,
  onSmartDeploy,
  onQuickDeploy,
  isDeploying = false,
}: AgentDetailCardProps) {
  const template = getTemplate(agentId)
  const details = getAgentDetails(agentId)

  if (!template || !details) {
    return (
      <div style={{ color: '#f0eff0' }}>
        <p>Agent not found</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#0c0c0d' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium mb-4"
            style={{ color: '#71717a' }}
          >
            <ChevronLeft size={16} />
            Back to Store
          </button>

          <div className="flex items-start gap-6">
            {/* Icon */}
            <div className="text-6xl">{template.icon}</div>

            {/* Title & Description */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold" style={{ color: '#f0eff0' }}>
                  {template.name}
                </h1>
                {template.badge && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: '#e879f9' }}
                  >
                    {template.badge}
                  </span>
                )}
              </div>

              <p className="text-lg font-semibold mb-2" style={{ color: '#e879f9' }}>
                {details.valueProposition}
              </p>

              <p style={{ color: '#71717a' }} className="text-sm">
                {template.description}
              </p>

              {/* Price */}
              <div className="mt-4">
                <p style={{ color: '#f0eff0' }} className="text-2xl font-bold">
                  ₹{details.costPerMonth.inr}/mo
                </p>
                <p style={{ color: '#71717a' }} className="text-xs">
                  ${details.costPerMonth.usd}/mo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* What this agent does */}
        <section>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#f0eff0' }}>
            What this agent does
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {details.capabilities.map((capability, i) => (
              <div key={i} className="flex gap-3">
                <div style={{ color: '#e879f9' }} className="flex-shrink-0 mt-1">
                  ✓
                </div>
                <p style={{ color: '#f0eff0' }} className="text-sm">
                  {capability}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Built-in skills */}
        <section>
          <h3 className="text-lg font-bold mb-3" style={{ color: '#f0eff0' }}>
            Built-in Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {details.builtInSkills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{
                  background: 'rgba(232,121,249,0.15)',
                  color: '#e879f9',
                  border: '1px solid rgba(232,121,249,0.3)',
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* India-specific features */}
        {details.indianSpecific && details.indianSpecific.length > 0 && (
          <section
            className="p-4 rounded-lg"
            style={{
              background: 'rgba(232,121,249,0.1)',
              border: '1px solid rgba(232,121,249,0.3)',
            }}
          >
            <h3 className="text-lg font-bold mb-3" style={{ color: '#e879f9' }}>
              🇮🇳 India-First Features
            </h3>
            <ul className="space-y-2">
              {details.indianSpecific.map((feature) => (
                <li key={feature} className="flex gap-2" style={{ color: '#f0eff0' }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* What you'll need */}
        <section>
          <h3 className="text-lg font-bold mb-3" style={{ color: '#f0eff0' }}>
            What you'll need
          </h3>
          <div
            className="p-4 rounded-lg space-y-2"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {details.credentialsRequired.map((req) => (
              <p key={req} style={{ color: '#71717a' }} className="text-sm">
                • {req}
              </p>
            ))}
            <p style={{ color: '#71717a' }} className="text-xs mt-3">
              ✓ All credentials are encrypted & never logged
            </p>
          </div>
        </section>

        {/* Best for */}
        <section>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#f0eff0' }}>
            Best For
          </h3>
          <p style={{ color: '#71717a' }} className="text-sm">
            {details.bestFor}
          </p>
        </section>

        {/* How it works */}
        <section>
          <h3 className="text-lg font-bold mb-2" style={{ color: '#f0eff0' }}>
            How It Works
          </h3>
          <p style={{ color: '#71717a' }} className="text-sm">
            {details.implementation}
          </p>
        </section>

        {/* Deploy Buttons */}
        <div className="flex gap-3 pt-6">
          <button
            onClick={onQuickDeploy}
            disabled={isDeploying}
            className="flex-1 py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: '#e879f9',
              color: '#0c0c0d',
            }}
          >
            <Zap size={18} />
            1-Click Deploy
          </button>

          <button
            onClick={onSmartDeploy}
            className="flex-1 py-3 rounded-lg font-bold text-sm transition-all border flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#f0eff0',
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Sparkles size={18} />
            Smart Deploy
          </button>
        </div>

        <p style={{ color: '#71717a' }} className="text-xs text-center">
          Smart Deploy = AI customizes for your business. 1-Click = Free trial with defaults.
        </p>
      </div>
    </div>
  )
}
