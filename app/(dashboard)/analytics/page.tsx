'use client'

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, MessageSquare, Zap } from 'lucide-react'
import { useState } from 'react'

const messageVolumeData = [
  { date: 'Mon', whatsapp: 45, email: 32, sms: 12 },
  { date: 'Tue', whatsapp: 52, email: 28, sms: 18 },
  { date: 'Wed', whatsapp: 48, email: 35, sms: 15 },
  { date: 'Thu', whatsapp: 61, email: 42, sms: 22 },
  { date: 'Fri', whatsapp: 55, email: 38, sms: 20 },
  { date: 'Sat', whatsapp: 38, email: 25, sms: 10 },
  { date: 'Sun', whatsapp: 42, email: 30, sms: 14 },
]

const skillUsageData = [
  { name: 'Send WhatsApp', value: 245 },
  { name: 'Web Search', value: 189 },
  { name: 'Send Email', value: 156 },
  { name: 'Schedule Job', value: 98 },
  { name: 'Other', value: 112 },
]

const responseTimeData = [
  { time: '0-1s', count: 234 },
  { time: '1-3s', count: 189 },
  { time: '3-5s', count: 76 },
  { time: '5-10s', count: 42 },
  { time: '10s+', count: 18 },
]

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface StatCard {
  label: string
  value: string | number
  change: string
  icon: any
  color: string
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d')

  const stats: StatCard[] = [
    {
      label: 'Total Messages',
      value: '1,247',
      change: '+12% from last week',
      icon: MessageSquare,
      color: 'text-blue-600',
    },
    {
      label: 'Avg Response Time',
      value: '1.2s',
      change: '-0.3s faster',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      label: 'Skills Used',
      value: '18',
      change: '+3 new skills',
      icon: Zap,
      color: 'text-purple-600',
    },
    {
      label: 'Active Agents',
      value: '9',
      change: 'All operating normally',
      icon: MessageSquare,
      color: 'text-orange-600',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <div className="flex gap-2">
            {['24h', '7d', '30d'].map(range => (
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
        <p className="text-gray-600">Real-time performance insights across all agents</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gray-50`}>
                  <Icon size={20} className={stat.color} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.change}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Message Volume */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Volume by Channel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={messageVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="whatsapp" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="email" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="sms" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skill Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skills Used</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={skillUsageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {skillUsageData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Usage Metrics Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance</h3>
          <div className="space-y-3">
            {[
              { name: 'LeadCatcher', messages: 234, responseTime: '0.8s', status: '✓' },
              { name: 'AppointBot', messages: 189, responseTime: '1.1s', status: '✓' },
              { name: 'CustomerSupport', messages: 156, responseTime: '1.5s', status: '✓' },
              { name: 'ReviewGuard', messages: 98, responseTime: '0.9s', status: '✓' },
              { name: 'InvoiceBot', messages: 42, responseTime: '2.1s', status: '⚠' },
            ].map((agent, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                <div className="flex items-center gap-6 text-xs text-gray-600">
                  <span>{agent.messages} messages</span>
                  <span>{agent.responseTime}</span>
                  <span className={agent.status === '✓' ? 'text-green-600' : 'text-yellow-600'}>
                    {agent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
