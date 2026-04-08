'use client'

import { useState, useEffect } from 'react'
import { authFetch } from '@/lib/auth/client'
import { getAgentDashboard } from '@/lib/agents/agent-dashboards'
import type { AgentUIIdentity } from '@/lib/agents/agent-ui-identity'
import { BarChart3 } from 'lucide-react'

interface ExecutionStat {
  total: number
  successful: number
  today: number
  avgDuration: number
  pending?: number
  revenue?: number
  conversionRate?: number
}

interface DashboardTabProps {
  agentId: string
  agentType?: string
  identity: AgentUIIdentity
}

export default function DashboardTab({ agentId, agentType, identity }: DashboardTabProps) {
  const [stats, setStats] = useState<ExecutionStat>({
    total: 0,
    successful: 0,
    today: 0,
    avgDuration: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activePeriod, setActivePeriod] = useState('7d')

  // Get dashboard config based on agent type
  const dashboardConfig = getAgentDashboard(agentType || 'customersupport')

  useEffect(() => {
    const load = async () => {
      try {
        const fixedRes = await authFetch(`/api/agents/${agentId}/stats?period=${activePeriod}`)
        if (fixedRes.ok) {
          const data = (await fixedRes.json()) as ExecutionStat
          setStats((prev) => ({ ...prev, ...data }))
        }
      } catch (e) {
        console.error('Stats load error:', e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [agentId, activePeriod])

  function formatMetricValue(key: string, format?: string): string {
    if (isLoading) return '—'
    const raw = stats[key as keyof ExecutionStat] || 0
    if (format === 'duration') return raw > 0 ? `${(raw / 1000).toFixed(1)}s` : '—'
    if (format === 'percent')
      return stats.total > 0 ? `${Math.round((stats.successful / stats.total) * 100)}%` : '0%'
    if (format === 'currency') return `₹${(raw as number).toLocaleString()}`
    return (raw as number).toLocaleString()
  }

  // Get metrics to display based on dashboard config or fall back to identity
  const displayMetrics = dashboardConfig.sections[0]?.metrics?.length
    ? dashboardConfig.sections[0].metrics
    : identity.metrics

  return (
    <div className="max-w-6xl space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end gap-2">
        {['7d', '30d', '90d'].map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activePeriod === period ? '' : ''
            }`}
            style={{
              background: activePeriod === period ? identity.accentBg : 'transparent',
              color: activePeriod === period ? identity.accent : '#71717a',
              border: `1px solid ${activePeriod === period ? identity.accent + '44' : 'transparent'}`,
            }}
          >
            {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {displayMetrics.slice(0, 4).map((metric) => (
          <div
            key={metric.key}
            className="p-5 rounded-xl transition-all hover:scale-[1.02]"
            style={{
              background: identity.accentBg,
              border: `1px solid ${identity.accent}22`,
            }}
          >
            <p className="text-2xl font-bold mb-1" style={{ color: identity.accent }}>
              {metric.key === 'successful' && metric.format === 'percent'
                ? stats.total > 0
                  ? `${Math.round((stats.successful / stats.total) * 100)}%`
                  : '—'
                : formatMetricValue(metric.key, metric.format)}
            </p>
            <p className="text-sm font-medium mb-0.5" style={{ color: '#f0eff0' }}>
              {metric.label}
            </p>
            <p className="text-xs" style={{ color: '#71717a' }}>
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      {/* Additional Stats Sections */}
      {dashboardConfig.sections.slice(1).map((section) => (
        <div key={section.id}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#71717a' }}>
            {section.title.toUpperCase()}
          </h3>

          {section.component === 'stats' && section.metrics && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {section.metrics.map((metric) => (
                <div
                  key={metric.key}
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#71717a' }}>
                    {metric.label}
                  </p>
                  <p className="text-xl font-bold" style={{ color: identity.accent }}>
                    {formatMetricValue(metric.key, metric.format)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {section.component === 'chart' && (
            <div
              className="p-6 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <BarChart3
                    size={48}
                    className="mx-auto mb-2 opacity-30"
                    style={{ color: identity.accent }}
                  />
                  <p className="text-sm" style={{ color: '#71717a' }}>
                    Chart visualization
                  </p>
                  <p className="text-xs" style={{ color: '#52525b' }}>
                    Connect data source to see charts
                  </p>
                </div>
              </div>
            </div>
          )}

          {section.component === 'table' && (
            <div
              className="p-6 rounded-xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th className="text-left py-3 px-2 font-medium" style={{ color: '#71717a' }}>
                      Item
                    </th>
                    <th className="text-right py-3 px-2 font-medium" style={{ color: '#71717a' }}>
                      Value
                    </th>
                    <th className="text-right py-3 px-2 font-medium" style={{ color: '#71717a' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Sample Item 1', value: '₹12,000', status: 'active' },
                    { name: 'Sample Item 2', value: '₹8,500', status: 'pending' },
                    { name: 'Sample Item 3', value: '₹5,200', status: 'active' },
                  ].map((row, i) => (
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
                                : 'rgba(234,179,8,0.2)',
                            color: row.status === 'active' ? '#10b981' : '#eab308',
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
          )}

          {section.component === 'list' && (
            <div className="space-y-2">
              {[
                { icon: '👤', title: 'John Doe', subtitle: 'Just now', badge: 'New' },
                { icon: '👤', title: 'Jane Smith', subtitle: '5 min ago', badge: 'Pending' },
                { icon: '👤', title: 'Bob Wilson', subtitle: '1 hour ago', badge: 'Resolved' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
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
                    className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ background: identity.accentBg, color: identity.accent }}
                  >
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Quick Actions */}
      {dashboardConfig.quickActions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#71717a' }}>
            QUICK ACTIONS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {dashboardConfig.quickActions.slice(0, 4).map((action, i) => (
              <button
                key={i}
                className="p-4 rounded-xl text-left transition-all hover:scale-[1.01] group"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${identity.accent}22`,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{action.icon}</span>
                  <p
                    className="text-sm font-medium group-hover:text-white"
                    style={{ color: '#f0eff0' }}
                  >
                    {action.label}
                  </p>
                </div>
                <p className="text-xs" style={{ color: '#71717a' }}>
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.total === 0 && !isLoading && (
        <div
          className="p-8 rounded-xl text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.1)',
          }}
        >
          <div className="text-4xl mb-3">{identity.defaultIcon}</div>
          <p className="text-base font-medium mb-2" style={{ color: '#f0eff0' }}>
            No activity yet
          </p>
          <p className="text-sm mb-4" style={{ color: '#71717a' }}>
            Test your {identity.tagline.toLowerCase()} agent in the Chat tab or connect WhatsApp to
            start receiving messages.
          </p>
          <div className="flex justify-center gap-3">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: identity.accent, color: '#0c0c0d' }}
            >
              Test in Chat
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: identity.accentBg,
                color: identity.accent,
                border: `1px solid ${identity.accent}44`,
              }}
            >
              Connect WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
