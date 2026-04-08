'use client'

import { Download, AlertCircle, CheckCircle, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { authFetch, useAuthSession } from '@/lib/auth/client'

interface UsageMetric {
  name: string
  used: number
  limit: number
  unit: string
  color: string
}

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending'
  description: string
}

export default function BillingPage() {
  const { user, isLoaded } = useAuthSession()
  const [activeTab, setActiveTab] = useState<'current' | 'addons' | 'invoices'>('current')
  const [realUsage, setRealUsage] = useState({ agentCount: 0, executionsThisMonth: 0 })

  useEffect(() => {
    if (!isLoaded || !user) return
    authFetch('/api/billing/summary')
      .then((r) => r.json())
      .then((d) => setRealUsage(d))
      .catch(() => {})
  }, [isLoaded, user])

  const currentPlan = {
    name: 'Free Trial',
    price: '₹0',
    billingCycle: 'Monthly',
    nextBilling: '—',
    status: 'active',
  }

  const usageMetrics: UsageMetric[] = [
    {
      name: 'Active Agents',
      used: realUsage.agentCount,
      limit: 3,
      unit: 'agents',
      color: 'bg-blue-100',
    },
    {
      name: 'AI Runs This Month',
      used: realUsage.executionsThisMonth,
      limit: 100,
      unit: 'runs/month',
      color: 'bg-green-100',
    },
    {
      name: 'WhatsApp Messages',
      used: 0,
      limit: 200,
      unit: 'messages/month',
      color: 'bg-purple-100',
    },
    { name: 'Emails Sent', used: 0, limit: 1000, unit: 'emails/month', color: 'bg-orange-100' },
  ]

  const addons = [
    { id: 1, name: '500 Extra Calls', price: '₹499', purchased: true, renewDate: '2026-04-28' },
    { id: 2, name: '2000 Extra WhatsApp', price: '₹399', purchased: false, renewDate: null },
    { id: 3, name: '5000 Extra Emails', price: '₹199', purchased: false, renewDate: null },
    {
      id: 4,
      name: 'diyaa.ai Powered AI (₹499/mo)',
      price: '₹499',
      purchased: true,
      renewDate: '2026-04-28',
    },
  ]

  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      date: '2026-03-28',
      amount: 2499,
      status: 'paid',
      description: 'Agent Plan (monthly)',
    },
    {
      id: 'INV-002',
      date: '2026-02-28',
      amount: 2498,
      status: 'paid',
      description: 'Agent Plan (monthly)',
    },
    {
      id: 'INV-003',
      date: '2026-01-28',
      amount: 2499,
      status: 'paid',
      description: 'Agent Plan (monthly)',
    },
    {
      id: 'INV-004',
      date: '2025-12-28',
      amount: 2499,
      status: 'paid',
      description: 'Agent Plan (monthly)',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Usage</h1>
        <p className="text-gray-600">Manage subscription, usage limits, and add-ons</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Current Plan: {currentPlan.name}
            </h3>
            <p className="text-sm text-gray-600">
              {currentPlan.price} / {currentPlan.billingCycle}
            </p>
          </div>
          <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
            <CheckCircle size={16} />
            Active
          </span>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 mb-4">
            Next billing date: <strong>28 April 2026</strong>
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
              Change Plan
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
              Download Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Usage Meter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {usageMetrics.map((metric, idx) => {
            const percentage = (metric.used / metric.limit) * 100
            const isWarning = percentage > 75
            const isCritical = percentage > 90

            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{metric.name}</span>
                  <span className="text-sm text-gray-600">
                    {metric.used} / {metric.limit} {metric.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                {isWarning && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠ {Math.round(100 - percentage)}% remaining
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(['current', 'addons', 'invoices'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'current' && 'Subscription'}
            {tab === 'addons' && 'Add-ons'}
            {tab === 'invoices' && 'Invoices'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Upgrade to Premium AI</p>
              <p className="text-sm text-blue-800 mt-1">
                Unlock unlimited API requests and priority support. Add for ₹999/month.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'addons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addons.map((addon) => (
            <div key={addon.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{addon.name}</h4>
                  <p className="text-lg font-bold text-gray-900 mt-1">{addon.price}</p>
                </div>
                {addon.purchased && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                    ✓ Active
                  </span>
                )}
              </div>
              <div className="border-t border-gray-200 pt-3">
                {addon.purchased ? (
                  <p className="text-xs text-gray-600">Renews on {addon.renewDate}</p>
                ) : (
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                    <Plus size={14} />
                    Add Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">{invoice.description}</p>
                <p className="text-sm text-gray-600">
                  {invoice.id} • {invoice.date}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-gray-900">₹{invoice.amount.toLocaleString()}</p>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    invoice.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {invoice.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </span>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Download size={18} className="text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
