'use client'

import { useState } from 'react'
import {
  Phone,
  Mail,
  MessageSquare,
  CreditCard,
  Wallet,
  Plus,
  Copy,
  RefreshCw,
  Settings,
  Globe,
  Shield,
} from 'lucide-react'

interface Identity {
  id: string
  type: 'phone' | 'email' | 'whatsapp' | 'bank' | 'crypto'
  label: string
  value: string
  status: 'active' | 'pending' | 'inactive'
  connected?: string
  icon: any
  color: string
}

const identities: Identity[] = [
  {
    id: '1',
    type: 'phone',
    label: 'Phone Number',
    value: '+91 98765 43210',
    status: 'active',
    connected: 'Exotel',
    icon: Phone,
    color: '#22c55e',
  },
  {
    id: '2',
    type: 'email',
    label: 'Email Address',
    value: 'agent@yourdomain.com',
    status: 'active',
    connected: 'Resend',
    icon: Mail,
    color: '#22c55e',
  },
  {
    id: '3',
    type: 'whatsapp',
    label: 'WhatsApp',
    value: '+91 98765 43210',
    status: 'pending',
    icon: MessageSquare,
    color: '#f59e0b',
  },
  {
    id: '4',
    type: 'bank',
    label: 'Bank Account',
    value: '****4567',
    status: 'inactive',
    connected: 'Razorpay',
    icon: CreditCard,
    color: '#737373',
  },
  {
    id: '5',
    type: 'crypto',
    label: 'Crypto Wallet',
    value: '0x4a3f...c91b',
    status: 'inactive',
    icon: Wallet,
    color: '#737373',
  },
]

export default function IdentityPage() {
  const [selectedAgent, setSelectedAgent] = useState('task-master')

  const agents = [
    { id: 'task-master', name: 'TaskMaster', icon: '📋' },
    { id: 'lead-catcher', name: 'LeadCatcher', icon: '🎯' },
    { id: 'appoint-bot', name: 'AppointBot', icon: '📅' },
    { id: 'pay-chaser', name: 'PayChaser', icon: '💰' },
  ]

  const statusColors = {
    active: { bg: '#dcfce7', color: '#166534', text: 'Active' },
    pending: { bg: '#fef3c7', color: '#92400e', text: 'Pending' },
    inactive: { bg: '#f5f5f5', color: '#737373', text: 'Not Connected' },
  }

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={20} style={{ color: '#22c55e' }} />
            <span className="text-sm font-medium" style={{ color: '#22c55e' }}>
              Agent Identity
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#171717' }}>
            Agent Identity
          </h1>
          <p style={{ color: '#737373' }}>
            Give your agents real-world identities - phone, email, and bank accounts
          </p>
        </div>

        {/* Agent Selector */}
        <div className="mb-8">
          <h3 className="text-sm font-medium mb-3" style={{ color: '#525252' }}>
            Select Agent
          </h3>
          <div className="flex gap-3 flex-wrap">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
                style={{
                  background: selectedAgent === agent.id ? '#171717' : '#f5f5f5',
                  border: selectedAgent === agent.id ? 'none' : '1px solid #e5e5e5',
                  color: selectedAgent === agent.id ? '#ffffff' : '#525252',
                }}
              >
                <span className="text-lg">{agent.icon}</span>
                <span className="font-medium">{agent.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Identity Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {identities.map((identity) => {
            const Icon = identity.icon
            const status = statusColors[identity.status]
            return (
              <div
                key={identity.id}
                className="rounded-xl p-6 transition-all hover:shadow-lg"
                style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: '#f5f5f5' }}
                  >
                    <Icon size={24} style={{ color: identity.color }} />
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: status.bg, color: status.color }}
                  >
                    {status.text}
                  </span>
                </div>

                <h3 className="font-semibold mb-1" style={{ color: '#171717' }}>
                  {identity.label}
                </h3>
                <p className="text-sm font-mono mb-3" style={{ color: '#525252' }}>
                  {identity.value}
                </p>

                {identity.connected && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#737373' }}>
                    <Globe size={12} />
                    Powered by {identity.connected}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#f5f5f5' }}>
                  {identity.status === 'active' ? (
                    <div className="flex items-center gap-2">
                      <button
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{ background: '#f5f5f5', color: '#171717' }}
                      >
                        <Settings size={14} />
                        Configure
                      </button>
                      <button
                        className="p-2 rounded-lg transition-all"
                        style={{ background: '#f5f5f5', color: '#737373' }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  ) : identity.status === 'pending' ? (
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#f59e0b' }}>
                      <RefreshCw size={14} className="animate-spin" />
                      Setting up...
                    </div>
                  ) : (
                    <button
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: '#22c55e', color: '#ffffff' }}
                    >
                      <Plus size={14} />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* What's Included */}
        <div
          className="rounded-xl p-6 mb-8"
          style={{ background: '#fafafa', border: '1px solid #e5e5e5' }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#171717' }}>
            What's included with Agent Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Phone, title: 'Phone Number', desc: 'Voice + SMS capabilities' },
              { icon: Mail, title: 'Email Address', desc: 'Professional inbox' },
              { icon: MessageSquare, title: 'WhatsApp', desc: 'Business messaging' },
              { icon: CreditCard, title: 'Bank Account', desc: 'Payment collection' },
              { icon: Wallet, title: 'Crypto Wallet', desc: 'Web3 payments' },
              { icon: Shield, title: 'Secure & Private', desc: 'End-to-end encrypted' },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                  >
                    <Icon size={18} style={{ color: '#22c55e' }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#171717' }}>
                      {item.title}
                    </p>
                    <p className="text-xs" style={{ color: '#737373' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
          >
            <p className="text-sm mb-1" style={{ color: '#737373' }}>
              Starter
            </p>
            <p className="text-3xl font-bold mb-2" style={{ color: '#171717' }}>
              ₹499
              <span className="text-base font-normal" style={{ color: '#737373' }}>
                /mo
              </span>
            </p>
            <ul className="text-sm space-y-2 mb-4" style={{ color: '#525252' }}>
              <li>✓ Phone number</li>
              <li>✓ Email address</li>
              <li>✓ Basic support</li>
            </ul>
            <button
              className="w-full py-2 rounded-lg text-sm font-medium"
              style={{ background: '#f5f5f5', color: '#171717' }}
            >
              Get Started
            </button>
          </div>

          <div
            className="rounded-xl p-6 text-center relative overflow-hidden"
            style={{ background: '#171717', border: 'none' }}
          >
            <div
              className="absolute top-0 right-0 px-3 py-1 text-xs font-medium"
              style={{ background: '#22c55e', color: '#ffffff' }}
            >
              Popular
            </div>
            <p className="text-sm mb-1" style={{ color: '#a3a3a3' }}>
              Business
            </p>
            <p className="text-3xl font-bold mb-2 text-white">
              ₹999
              <span className="text-base font-normal" style={{ color: '#a3a3a3' }}>
                /mo
              </span>
            </p>
            <ul className="text-sm space-y-2 mb-4 text-left" style={{ color: '#d4d4d4' }}>
              <li>✓ Phone + Email</li>
              <li>✓ WhatsApp</li>
              <li>✓ Payment links</li>
              <li>✓ Priority support</li>
            </ul>
            <button
              className="w-full py-2 rounded-lg text-sm font-medium"
              style={{ background: '#22c55e', color: '#ffffff' }}
            >
              Get Started
            </button>
          </div>

          <div
            className="rounded-xl p-6 text-center"
            style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
          >
            <p className="text-sm mb-1" style={{ color: '#737373' }}>
              Enterprise
            </p>
            <p className="text-3xl font-bold mb-2" style={{ color: '#171717' }}>
              Custom
            </p>
            <ul className="text-sm space-y-2 mb-4" style={{ color: '#525252' }}>
              <li>✓ Full identity suite</li>
              <li>✓ Bank account</li>
              <li>✓ Crypto wallet</li>
              <li>✓ Dedicated support</li>
            </ul>
            <button
              className="w-full py-2 rounded-lg text-sm font-medium"
              style={{ background: '#f5f5f5', color: '#171717' }}
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
