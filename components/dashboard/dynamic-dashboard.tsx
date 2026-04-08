'use client'

import { useState, useEffect } from 'react'
import { getAgentDashboard } from '@/lib/agents/agent-dashboards'
import type { AgentUIIdentity } from '@/lib/agents/agent-ui-identity'
import { BarChart3 } from 'lucide-react'

interface DashboardProps {
  agentId: string
  identity: AgentUIIdentity
}

interface AgentStats {
  total: number
  successful: number
  today: number
  pending: number
  revenue?: number
  conversionRate?: number
  avgResponseTime?: number
}

export default function DynamicDashboard({ agentId, identity }: DashboardProps) {
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  const dashboardConfig = getAgentDashboard(
    identity.tagline?.toLowerCase().includes('invoice')
      ? 'invoicebot'
      : identity.tagline?.toLowerCase().includes('lead')
        ? 'leadcatcher'
        : identity.tagline?.toLowerCase().includes('appointment')
          ? 'appointbot'
          : identity.tagline?.toLowerCase().includes('payment')
            ? 'paymentreminder'
            : identity.tagline?.toLowerCase().includes('review')
              ? 'feedbackanalyzer'
              : identity.tagline?.toLowerCase().includes('document')
                ? 'docharvest'
                : identity.tagline?.toLowerCase().includes('content')
                  ? 'contentengine'
                  : 'customersupport'
  )

  useEffect(() => {
    loadStats()
  }, [agentId, selectedPeriod])

  const loadStats = async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/stats?period=${selectedPeriod}`)
      const data = await res.json()
      setStats(data.stats || getMockStats(identity))
    } catch {
      setStats(getMockStats(identity))
    } finally {
      setLoading(false)
    }
  }

  const renderMetricValue = (value: number | undefined, format?: string) => {
    if (value === undefined) return '-'

    switch (format) {
      case 'currency':
        return `₹${value.toLocaleString()}`
      case 'percent':
        return `${value}%`
      case 'duration':
        return value < 60 ? `${value}m` : `${Math.floor(value / 60)}h ${value % 60}m`
      default:
        return value.toLocaleString()
    }
  }

  const renderSection = (section: (typeof dashboardConfig.sections)[0]) => {
    switch (section.component) {
      case 'stats':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {section.metrics?.map((metric) => (
              <div
                key={metric.key}
                className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#71717a' }}>
                  {metric.label}
                </p>
                <p className="text-2xl font-bold" style={{ color: identity.accent }}>
                  {renderMetricValue(
                    stats?.[metric.key as keyof AgentStats] as number,
                    metric.format
                  )}
                </p>
                <p className="text-xs mt-1" style={{ color: '#71717a' }}>
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        )

      case 'chart':
        return (
          <div
            className="p-6 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium" style={{ color: '#f0eff0' }}>
                {section.title}
              </h3>
              <div className="flex gap-2">
                {['7d', '30d', '90d'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPeriod(p)}
                    className={`px-3 py-1 rounded text-xs ${selectedPeriod === p ? '' : ''}`}
                    style={{
                      background: selectedPeriod === p ? identity.accentBg : 'transparent',
                      color: selectedPeriod === p ? identity.accent : '#71717a',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-48 flex items-center justify-center" style={{ color: '#71717a' }}>
              {loading ? 'Loading...' : <BarChart3 size={48} className="opacity-30" />}
            </div>
          </div>
        )

      case 'table':
        return (
          <div
            className="p-6 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h3 className="text-sm font-medium mb-4" style={{ color: '#f0eff0' }}>
              {section.title}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th className="text-left py-3 px-2" style={{ color: '#71717a' }}>
                      Name
                    </th>
                    <th className="text-right py-3 px-2" style={{ color: '#71717a' }}>
                      Value
                    </th>
                    <th className="text-right py-3 px-2" style={{ color: '#71717a' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getTableData(identity).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="py-3 px-2" style={{ color: '#f0eff0' }}>
                        {row.name}
                      </td>
                      <td className="text-right py-3 px-2" style={{ color: identity.accent }}>
                        {row.value}
                      </td>
                      <td className="text-right py-3 px-2">
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            background:
                              row.status === 'active'
                                ? 'rgba(16,185,129,0.2)'
                                : 'rgba(239,68,68,0.2)',
                            color: row.status === 'active' ? '#10b981' : '#ef4444',
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'list':
        return (
          <div
            className="p-6 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h3 className="text-sm font-medium mb-4" style={{ color: '#f0eff0' }}>
              {section.title}
            </h3>
            <div className="space-y-3">
              {getListData(identity).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: identity.accentBg }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#f0eff0' }}>
                        {item.title}
                      </p>
                      <p className="text-xs" style={{ color: '#71717a' }}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: identity.accentBg, color: identity.accent }}
                  >
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      {dashboardConfig.quickActions.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {dashboardConfig.quickActions.map((action, i) => (
            <button
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: identity.accentBg,
                color: identity.accent,
                border: `1px solid ${identity.accent}33`,
              }}
            >
              <span>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Dashboard Sections */}
      {dashboardConfig.sections.map((section) => (
        <div key={section.id}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#f0eff0' }}>
            {section.title}
          </h3>
          {renderSection(section)}
        </div>
      ))}

      {/* Empty state if no config */}
      {dashboardConfig.sections.length === 0 && (
        <div
          className="p-12 text-center rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#f0eff0' }}>
            Dashboard Coming Soon
          </h3>
          <p className="text-sm" style={{ color: '#71717a' }}>
            We're building the perfect dashboard for this agent type
          </p>
        </div>
      )}
    </div>
  )
}

// Mock data generators based on agent type
function getMockStats(_identity: AgentUIIdentity): AgentStats {
  return {
    total: 1247,
    successful: 892,
    today: 23,
    pending: 45,
    revenue: 156000,
    conversionRate: 12.5,
    avgResponseTime: 4,
  }
}

function getTableData(_identity: AgentUIIdentity) {
  return [
    { name: 'Item 1', value: '₹12,000', status: 'active' },
    { name: 'Item 2', value: '₹8,500', status: 'active' },
    { name: 'Item 3', value: '₹5,200', status: 'pending' },
  ]
}

function getListData(_identity: AgentUIIdentity) {
  return [
    { icon: '👤', title: 'John Doe', subtitle: 'Just now', badge: 'New' },
    { icon: '👤', title: 'Jane Smith', subtitle: '5 min ago', badge: 'Pending' },
    { icon: '👤', title: 'Bob Wilson', subtitle: '1 hour ago', badge: 'Resolved' },
  ]
}
