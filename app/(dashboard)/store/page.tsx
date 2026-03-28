'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

const agents = [
  {
    id: 1,
    name: 'LeadCatcher',
    category: 'Sales',
    icon: '🎯',
    desc: 'WhatsApp lead capture + instant follow-up',
    pain: 'Never miss a lead again',
    features: ['Lead capture', 'Auto-follow-up', 'WhatsApp messages'],
    targetBusiness: 'Any business',
  },
  {
    id: 2,
    name: 'AppointBot',
    category: 'Scheduling',
    icon: '📅',
    desc: 'Appointment booking + reminder via WhatsApp',
    pain: 'No-shows killing your business',
    features: ['Booking calendar', 'Reminders', 'Confirmations'],
    targetBusiness: 'Clinic, Salon, Gym, Consultant',
  },
  {
    id: 3,
    name: 'PayChaser',
    category: 'Collections',
    icon: '💰',
    desc: 'Payment due reminders + UPI link sender',
    pain: 'Chasing money manually',
    features: ['Due reminders', 'UPI links', 'Payment tracking'],
    targetBusiness: 'Any business with invoices',
  },
  {
    id: 4,
    name: 'GSTMate',
    category: 'Accounting',
    icon: '📊',
    desc: 'GST invoice generation + GSTR reconciliation',
    pain: 'Complex GST compliance',
    features: ['Invoice generation', 'GSTR sync', 'Tax compliance'],
    targetBusiness: 'Every registered Indian business',
  },
  {
    id: 5,
    name: 'CustomerSupport',
    category: 'Support',
    icon: '💬',
    desc: '24/7 WhatsApp/email/phone support',
    pain: 'Missing customer messages',
    features: ['Multi-channel', '24/7 support', 'Chat history'],
    targetBusiness: 'Retail, E-com, SaaS, D2C',
  },
  {
    id: 6,
    name: 'ReviewGuard',
    category: 'Reputation',
    icon: '⭐',
    desc: 'Review monitoring + auto-response',
    pain: 'Bad reviews going unaddressed',
    features: ['Review monitor', 'Auto-reply', 'Multi-platform'],
    targetBusiness: 'Restaurant, Hotel, Salon, Retail',
  },
  {
    id: 7,
    name: 'InvoiceBot',
    category: 'Accounting',
    icon: '📄',
    desc: 'Auto invoice + GST + UPI reconciliation',
    pain: 'Manual invoicing is time-consuming',
    features: ['Auto-invoice', 'GST handling', 'UPI integration'],
    targetBusiness: 'CA firms, Freelancers, MSMEs',
  },
  {
    id: 8,
    name: 'WhatsBlast',
    category: 'Marketing',
    icon: '📢',
    desc: 'WhatsApp campaign broadcast + segmentation',
    pain: 'No way to reach customers at scale',
    features: ['Broadcasts', 'Segmentation', 'Analytics'],
    targetBusiness: 'Any consumer business',
  },
  {
    id: 9,
    name: 'DocHarvest',
    category: 'Operations',
    icon: '📋',
    desc: 'Client document collection automation',
    pain: 'Chasing clients for documents',
    features: ['Doc collection', 'Reminders', 'Organization'],
    targetBusiness: 'CA firm, Legal, Immigration',
  },
  {
    id: 10,
    name: 'NurtureBot',
    category: 'Sales',
    icon: '🌱',
    desc: 'Lead nurture drip sequence (multi-channel)',
    pain: 'Leads going cold without follow-up',
    features: ['Drip campaigns', 'Personalization', 'Multi-channel'],
    targetBusiness: 'Sales teams, D2C brands',
  },
  {
    id: 11,
    name: 'StockSentinel',
    category: 'Operations',
    icon: '📦',
    desc: 'Inventory reorder alert + supplier order',
    pain: 'Stockouts losing revenue',
    features: ['Stock alerts', 'Auto-reorder', 'Supplier sync'],
    targetBusiness: 'Pharmacy, Retail, FMCG',
  },
  {
    id: 12,
    name: 'PatientPulse',
    category: 'Healthcare',
    icon: '🏥',
    desc: 'Patient follow-up + prescription refill reminder',
    pain: 'Patients forgetting follow-ups',
    features: ['Patient follow-up', 'Prescription reminder', 'Compliance'],
    targetBusiness: 'Clinic, Hospital, Diagnostic center',
  },
  {
    id: 13,
    name: 'ResumeFilter',
    category: 'HR',
    icon: '👤',
    desc: 'AI resume screening + shortlisting agent',
    pain: 'Manual resume screening is tedious',
    features: ['Resume screening', 'Shortlisting', 'Ranking'],
    targetBusiness: 'HR/Recruitment agency, IT firm',
  },
  {
    id: 14,
    name: 'SocialSched',
    category: 'Marketing',
    icon: '📱',
    desc: 'Social media calendar + publisher (all platforms)',
    pain: 'Posting manually to every platform',
    features: ['Calendar', 'Multi-platform', 'Scheduling'],
    targetBusiness: 'Agency, D2C brand, Creator',
  },
  {
    id: 15,
    name: 'FeeCollect',
    category: 'Education',
    icon: '🎓',
    desc: 'Fee reminder + installment tracking agent',
    pain: 'Fee collection delays',
    features: ['Fee reminder', 'Installment tracking', 'Reporting'],
    targetBusiness: 'School, Coaching institute, Tuition',
  },
]

const categories = ['All', ...new Set(agents.map(a => a.category))]

export default function AgentStorePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agent.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agent.targetBusiness.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || agent.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Store</h1>
        <p className="text-gray-600">Choose from 50+ pre-built agents or create your own</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents, use cases, or industries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 text-sm text-gray-600">
        Found {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}
      </div>

      {/* Agent Cards Grid */}
      {filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow flex flex-col"
            >
              {/* Icon & Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{agent.icon}</div>
                <span className="text-xs font-bold text-white bg-gray-400 px-2 py-1 rounded">
                  {agent.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-1">{agent.name}</h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-2">{agent.desc}</p>

              {/* Pain Point */}
              <div className="text-xs text-blue-600 font-medium mb-4 p-2 bg-blue-50 rounded">
                💡 {agent.pain}
              </div>

              {/* Features */}
              <div className="mb-4 flex-1">
                <p className="text-xs font-semibold text-gray-700 mb-2">Features:</p>
                <div className="space-y-1">
                  {agent.features.map((feature, i) => (
                    <p key={i} className="text-xs text-gray-600 flex items-center gap-1">
                      <span className="text-green-600">✓</span> {feature}
                    </p>
                  ))}
                </div>
              </div>

              {/* Target */}
              <p className="text-xs text-gray-500 mb-4 italic">For: {agent.targetBusiness}</p>

              {/* Deploy Button */}
              <Link
                href="/create-agent"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium text-sm text-center transition-colors"
              >
                Deploy Agent
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No agents found matching your search</p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('All')
            }}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-sm text-gray-700 mb-2">
          <strong>Want a custom agent?</strong>
        </p>
        <Link
          href="/create-agent"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Build your own agent from scratch →
        </Link>
      </div>
    </div>
  )
}
