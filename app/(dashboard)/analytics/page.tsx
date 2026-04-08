'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, MessageSquare, Zap, Bot } from 'lucide-react'
import { useState, useEffect } from 'react'
import { authFetch, useAuthSession } from '@/lib/auth/client'

interface AnalyticsSummary {
  totalMessages: number
  activeAgents: number
  avgDurationMs: number
  dailyVolume: { date: string; messages: number }[]
  agentPerformance: {
    name: string
    messages: number
    avgMs: number
    successRate: number
    status: string
  }[]
}

export default function AnalyticsPage() {
  const { user, isLoaded } = useAuthSession()
  const [dateRange, setDateRange] = useState('7d')
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user) return
    setLoading(true)
    authFetch('/api/analytics/summary')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [isLoaded, user, dateRange])

  const stats = [
    {
      label: 'Total Messages',
      value: loading ? '...' : (data?.totalMessages ?? 0).toLocaleString(),
      sub: 'All-time executions',
      icon: MessageSquare,
      color: 'text-blue-600',
    },
    {
      label: 'Avg Response Time',
      value: loading ? '...' : data ? `${((data.avgDurationMs || 0) / 1000).toFixed(1)}s` : '0s',
      sub: 'Average AI response',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Active Agents',
      value: loading ? '...' : (data?.activeAgents ?? 0),
      sub: 'Currently running',
      icon: Bot,
      color: 'text-purple-600',
    },
    {
      label: 'Success Rate',
      value: loading
        ? '...'
        : data?.agentPerformance?.length
          ? `${Math.round(data.agentPerformance.reduce((s, a) => s + a.successRate, 0) / data.agentPerformance.length)}%`
          : '—',
      sub: 'Successful executions',
      icon: Zap,
      color: 'text-orange-600',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <div className="flex gap-2">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <p className="text-gray-600">Performance insights across all your agents</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-gray-50">
                  <Icon size={20} className={stat.color} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Message Volume */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Message Volume</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.dailyVolume || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="messages" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Agent Performance Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
          ) : !data?.agentPerformance?.length ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No agents yet. Deploy an agent to see stats.
            </div>
          ) : (
            <div className="space-y-3">
              {data.agentPerformance.map((agent, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                    {agent.name}
                  </span>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>{agent.messages} runs</span>
                    <span>{agent.avgMs > 0 ? `${(agent.avgMs / 1000).toFixed(1)}s` : '—'}</span>
                    <span
                      className={agent.successRate >= 90 ? 'text-green-600' : 'text-yellow-600'}
                    >
                      {agent.successRate}%
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        agent.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity trend if we have data */}
      {!loading && (data?.dailyVolume?.length ?? 0) > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.dailyVolume || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
