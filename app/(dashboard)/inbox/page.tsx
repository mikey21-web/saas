'use client'

import { useState } from 'react'

type Tab = 'all' | 'approval' | 'escalations'

const mockMessages = [
  {
    id: 1,
    agentName: 'LeadCatcher',
    from: '+91 98765 43210',
    channel: 'whatsapp',
    message: 'I want to know about your dental services',
    time: '2 min ago',
    status: 'pending',
  },
  {
    id: 2,
    agentName: 'CustomerSupport',
    from: 'customer@example.com',
    channel: 'email',
    message: 'My order #1234 has not arrived yet',
    time: '15 min ago',
    status: 'escalated',
  },
  {
    id: 3,
    agentName: 'AppointBot',
    from: '+91 87654 32109',
    channel: 'whatsapp',
    message: 'Can I reschedule my appointment to Thursday?',
    time: '1 hr ago',
    status: 'resolved',
  },
]

export default function InboxPage() {
  const [tab, setTab] = useState<Tab>('all')

  const filtered = mockMessages.filter((m) => {
    if (tab === 'approval') return m.status === 'pending'
    if (tab === 'escalations') return m.status === 'escalated'
    return true
  })

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    escalated: 'bg-red-100 text-red-700',
    resolved: 'bg-green-100 text-green-700',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inbox</h1>
        <p className="text-gray-600">Messages that need your attention</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all' as Tab, label: 'All', count: mockMessages.length },
          {
            id: 'approval' as Tab,
            label: 'Needs Approval',
            count: mockMessages.filter((m) => m.status === 'pending').length,
          },
          {
            id: 'escalations' as Tab,
            label: 'Escalations',
            count: mockMessages.filter((m) => m.status === 'escalated').length,
          },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {filtered.map((msg) => (
          <div
            key={msg.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-lg">{msg.channel === 'whatsapp' ? '💬' : '📧'}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{msg.agentName}</p>
                  <p className="text-xs text-gray-500">{msg.from}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${statusColor[msg.status]}`}
                >
                  {msg.status}
                </span>
                <span className="text-xs text-gray-400">{msg.time}</span>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-3">{msg.message}</p>
            <div className="flex gap-2">
              <button disabled className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-xs font-medium cursor-not-allowed opacity-50">
                Take Over (Coming Soon)
              </button>
              <button disabled className="px-3 py-1 border border-gray-200 text-gray-400 rounded text-xs font-medium cursor-not-allowed opacity-50">
                View Thread (Coming Soon)
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-4xl mb-4">📬</p>
          <p className="text-gray-600">No messages in this category</p>
        </div>
      )}
    </div>
  )
}
