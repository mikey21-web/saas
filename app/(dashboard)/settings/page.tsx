'use client'

import {
  User,
  Lock,
  Bell,
  Trash2,
  LogOut,
  Save,
  Users,
  CreditCard,
  Key,
  Plus,
  Copy as CopyIcon,
  Trash,
  ExternalLink,
  Download,
  AlertTriangle,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthSession } from '@/lib/auth/client'

interface SettingsForm {
  fullName: string
  email: string
  businessName: string
  timezone: string
  language: string
  emailNotifications: boolean
  smsNotifications: boolean
  weeklyReport: boolean
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  avatar?: string
  status: 'active' | 'pending'
  joinedAt?: string
}

interface APIKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed?: string
  permissions: string[]
}

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  description: string
}

export default function SettingsPage() {
  const { user, isLoaded, signOut } = useAuthSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<
    'profile' | 'notifications' | 'security' | 'team' | 'billing' | 'api' | 'danger'
  >('profile')
  const [formData, setFormData] = useState<SettingsForm>({
    fullName: '',
    email: '',
    businessName: '',
    timezone: 'Asia/Kolkata',
    language: 'English',
    emailNotifications: true,
    smsNotifications: true,
    weeklyReport: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Team state
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'You',
      email: 'you@business.com',
      role: 'owner',
      status: 'active',
      joinedAt: '2024-01-01',
    },
  ])

  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Production Key',
      key: 'dyaa_sk_live_xxxx...xxxx',
      createdAt: '2024-01-15',
      lastUsed: '2 hours ago',
      permissions: ['read', 'write'],
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'dyaa_sk_test_xxxx...xxxx',
      createdAt: '2024-02-01',
      lastUsed: '5 days ago',
      permissions: ['read'],
    },
  ])

  // Invoices state
  const [invoices] = useState<Invoice[]>([
    {
      id: 'INV-001',
      date: '2024-03-01',
      amount: 4999,
      status: 'paid',
      description: 'TaskMaster Agent - Monthly',
    },
    {
      id: 'INV-002',
      date: '2024-02-01',
      amount: 4999,
      status: 'paid',
      description: 'TaskMaster Agent - Monthly',
    },
    {
      id: 'INV-003',
      date: '2024-04-01',
      amount: 4999,
      status: 'pending',
      description: 'TaskMaster Agent - Monthly',
    },
  ])

  useEffect(() => {
    if (isLoaded && user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
      }))
    }
  }, [isLoaded, user])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setTimeout(() => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setIsSaving(false)
    }, 1000)
  }

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key)
  }

  const deleteApiKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id))
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#171717' }}>
            Settings
          </h1>
          <p style={{ color: '#737373' }}>Manage your account, team, billing, and security</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div
              className="rounded-xl overflow-hidden sticky top-20"
              style={{ background: '#fafafa', border: '1px solid #e5e5e5' }}
            >
              {tabs.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left font-medium transition-all border-l-4"
                    style={{
                      background: activeTab === item.id ? '#ffffff' : 'transparent',
                      color: activeTab === item.id ? '#171717' : '#737373',
                      borderColor: activeTab === item.id ? '#22c55e' : 'transparent',
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div
                  className="rounded-xl p-6"
                  style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#171717' }}>
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: '#525252' }}
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
                        style={{ background: '#fafafa', borderColor: '#e5e5e5', color: '#171717' }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: '#525252' }}
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
                        style={{ background: '#fafafa', borderColor: '#e5e5e5', color: '#171717' }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: '#525252' }}
                      >
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
                        style={{ background: '#fafafa', borderColor: '#e5e5e5', color: '#171717' }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl p-6"
                  style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#171717' }}>
                    Preferences
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: '#525252' }}
                      >
                        Timezone
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
                        style={{ background: '#fafafa', borderColor: '#e5e5e5', color: '#171717' }}
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50"
                  style={{ background: '#171717', color: '#ffffff' }}
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Team */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                <div
                  className="rounded-xl p-6"
                  style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#171717' }}>
                      Team Members
                    </h3>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: '#22c55e', color: '#ffffff' }}
                    >
                      <Plus size={16} />
                      Invite Member
                    </button>
                  </div>

                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{ background: '#fafafa', border: '1px solid #e5e5e5' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-medium"
                            style={{ background: '#22c55e', color: '#ffffff' }}
                          >
                            {member.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: '#171717' }}>
                              {member.name}
                            </p>
                            <p className="text-sm" style={{ color: '#737373' }}>
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: member.role === 'owner' ? '#dcfce7' : '#f5f5f5',
                              color: member.role === 'owner' ? '#166534' : '#525252',
                            }}
                          >
                            {member.role}
                          </span>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: member.status === 'active' ? '#dcfce7' : '#fef3c7',
                              color: member.status === 'active' ? '#166534' : '#92400e',
                            }}
                          >
                            {member.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Billing */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                {/* Current Plan */}
                <div
                  className="rounded-xl p-6"
                  style={{
                    background: 'linear-gradient(135deg, #171717 0%, #333 100%)',
                    border: 'none',
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm" style={{ color: '#a3a3a3' }}>
                        Current Plan
                      </p>
                      <h3 className="text-2xl font-bold text-white">Business Plan</h3>
                    </div>
                    <span className="px-4 py-1 rounded-full text-sm font-medium bg-white/10 text-white">
                      Active
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-white">
                        ₹4,999<span className="text-lg font-normal text-white/70">/mo</span>
                      </p>
                      <p className="text-sm text-white/70">Next billing: May 1, 2024</p>
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: '#22c55e', color: '#ffffff' }}
                    >
                      Upgrade Plan
                    </button>
                  </div>
                </div>

                {/* Usage */}
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className="rounded-xl p-4"
                    style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                  >
                    <p className="text-sm mb-1" style={{ color: '#737373' }}>
                      Tasks This Month
                    </p>
                    <p className="text-2xl font-bold" style={{ color: '#171717' }}>
                      847
                    </p>
                    <p className="text-xs" style={{ color: '#22c55e' }}>
                      of 1,000 included
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                  >
                    <p className="text-sm mb-1" style={{ color: '#737373' }}>
                      Active Agents
                    </p>
                    <p className="text-2xl font-bold" style={{ color: '#171717' }}>
                      3
                    </p>
                    <p className="text-xs" style={{ color: '#737373' }}>
                      of 5 allowed
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                  >
                    <p className="text-sm mb-1" style={{ color: '#737373' }}>
                      API Calls
                    </p>
                    <p className="text-2xl font-bold" style={{ color: '#171717' }}>
                      12.4K
                    </p>
                    <p className="text-xs" style={{ color: '#737373' }}>
                      unlimited
                    </p>
                  </div>
                </div>

                {/* Invoices */}
                <div
                  className="rounded-xl p-6"
                  style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#171717' }}>
                      Invoices
                    </h3>
                    <button
                      className="flex items-center gap-2 text-sm"
                      style={{ color: '#22c55e' }}
                    >
                      <Download size={16} />
                      Download All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{ background: '#fafafa', border: '1px solid #e5e5e5' }}
                      >
                        <div>
                          <p className="font-medium" style={{ color: '#171717' }}>
                            {invoice.id}
                          </p>
                          <p className="text-sm" style={{ color: '#737373' }}>
                            {invoice.description}
                          </p>
                          <p className="text-xs" style={{ color: '#a3a3a3' }}>
                            {invoice.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold" style={{ color: '#171717' }}>
                            ₹{invoice.amount.toLocaleString()}
                          </p>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              background:
                                invoice.status === 'paid'
                                  ? '#dcfce7'
                                  : invoice.status === 'pending'
                                    ? '#fef3c7'
                                    : '#fee2e2',
                              color:
                                invoice.status === 'paid'
                                  ? '#166534'
                                  : invoice.status === 'pending'
                                    ? '#92400e'
                                    : '#991b1b',
                            }}
                          >
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* API Keys */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div
                  className="rounded-xl p-6"
                  style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: '#171717' }}>
                        API Keys
                      </h3>
                      <p className="text-sm" style={{ color: '#737373' }}>
                        Manage your API keys for programmatic access
                      </p>
                    </div>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: '#22c55e', color: '#ffffff' }}
                    >
                      <Plus size={16} />
                      Create Key
                    </button>
                  </div>

                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{ background: '#fafafa', border: '1px solid #e5e5e5' }}
                      >
                        <div>
                          <p className="font-medium" style={{ color: '#171717' }}>
                            {key.name}
                          </p>
                          <p className="text-sm font-mono" style={{ color: '#737373' }}>
                            {key.key}
                          </p>
                          <p className="text-xs" style={{ color: '#a3a3a3' }}>
                            Created: {key.createdAt} • Last used: {key.lastUsed}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyApiKey(key.key)}
                            className="p-2 rounded-lg transition-all hover:bg-gray-200"
                          >
                            <CopyIcon size={16} style={{ color: '#737373' }} />
                          </button>
                          <button
                            onClick={() => deleteApiKey(key.id)}
                            className="p-2 rounded-lg transition-all hover:bg-red-100"
                          >
                            <Trash size={16} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-xl p-6"
                  style={{ background: '#fafafa', border: '1px solid #e5e5e5' }}
                >
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#171717' }}>
                    Documentation
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#737373' }}>
                    Learn how to integrate diyaa.ai into your applications
                  </p>
                  <a
                    href="#"
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: '#22c55e' }}
                  >
                    View API Docs <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div
                className="rounded-xl p-6"
                style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
              >
                <h3 className="text-lg font-semibold mb-6" style={{ color: '#171717' }}>
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      id: 'emailNotifications',
                      label: 'Email Notifications',
                      description: 'Receive email alerts for agent events and system updates',
                    },
                    {
                      id: 'smsNotifications',
                      label: 'SMS Notifications',
                      description: 'Receive SMS for critical alerts (usage limits, errors)',
                    },
                    {
                      id: 'weeklyReport',
                      label: 'Weekly Report',
                      description: 'Get a weekly summary of agent performance and metrics',
                    },
                  ].map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-4 rounded-lg"
                      style={{ background: '#fafafa', border: '1px solid #e5e5e5' }}
                    >
                      <input
                        type="checkbox"
                        id={notification.id}
                        checked={formData[notification.id as keyof SettingsForm] as boolean}
                        onChange={(e) => handleInputChange(notification.id, e.target.checked)}
                        className="mt-1 w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={notification.id}
                          className="block font-medium cursor-pointer"
                          style={{ color: '#171717' }}
                        >
                          {notification.label}
                        </label>
                        <p className="text-sm mt-0.5" style={{ color: '#737373' }}>
                          {notification.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSave}
                  className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all"
                  style={{ background: '#171717', color: '#ffffff' }}
                >
                  <Save size={16} />
                  Save Preferences
                </button>
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div
                  className="rounded-xl p-6"
                  style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#171717' }}>
                    Password
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#737373' }}>
                    Your account uses Clerk for secure authentication.
                  </p>
                  <button
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                    style={{ background: '#f5f5f5', border: '1px solid #e5e5e5', color: '#171717' }}
                  >
                    Manage Account
                  </button>
                </div>

                <div
                  className="rounded-xl p-6"
                  style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#171717' }}>
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#737373' }}>
                    Add an extra layer of security to your account.
                  </p>
                  <button
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                    style={{ background: '#22c55e', color: '#ffffff' }}
                  >
                    Enable 2FA
                  </button>
                </div>

                <div
                  className="rounded-xl p-6"
                  style={{ background: '#ffffff', border: '1px solid #e5e5e5' }}
                >
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#171717' }}>
                    Active Sessions
                  </h3>
                  <div className="space-y-3">
                    <div
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ background: '#fafafa', border: '1px solid #e5e5e5' }}
                    >
                      <div>
                        <p className="font-medium" style={{ color: '#171717' }}>
                          This Device
                        </p>
                        <p className="text-xs" style={{ color: '#737373' }}>
                          Last active: now
                        </p>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: '#dcfce7', color: '#166534' }}
                      >
                        Current
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div
                  className="rounded-xl p-6"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
                >
                  <h3
                    className="text-lg font-semibold mb-2 flex items-center gap-2"
                    style={{ color: '#991b1b' }}
                  >
                    <AlertTriangle size={20} />
                    Delete Account
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#991b1b' }}>
                    Permanently delete your account and all associated data. This action cannot be
                    undone.
                  </p>
                  <button
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                    style={{ background: '#dc2626', color: '#ffffff' }}
                  >
                    Delete Account
                  </button>
                </div>

                <div
                  className="rounded-xl p-6"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
                >
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#991b1b' }}>
                    Download My Data
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#991b1b' }}>
                    Download a copy of all your data in JSON format.
                  </p>
                  <button
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                    style={{ background: '#dc2626', color: '#ffffff' }}
                  >
                    Export Data
                  </button>
                </div>

                <div
                  className="rounded-xl p-6"
                  style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
                >
                  <h3
                    className="text-lg font-semibold mb-2 flex items-center gap-2"
                    style={{ color: '#991b1b' }}
                  >
                    <LogOut size={20} />
                    Sign Out
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#991b1b' }}>
                    Sign out of your account on all devices.
                  </p>
                  <button
                    onClick={() => {
                      signOut()
                      router.push('/sign-in')
                    }}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                    style={{ background: '#dc2626', color: '#ffffff' }}
                  >
                    Sign Out Everywhere
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
