'use client'

import { BookOpen, Play, Search, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const guides = [
  {
    category: 'Getting Started',
    items: [
      { title: 'Deploy your first AI agent in 5 minutes', duration: '5 min read', type: 'article' },
      {
        title: 'Understanding the Smart Deploy interview',
        duration: '3 min read',
        type: 'article',
      },
      { title: 'Setting up WhatsApp for your agent', duration: '8 min read', type: 'article' },
    ],
  },
  {
    category: 'Agent Configuration',
    items: [
      { title: 'Configuring active hours and timezone', duration: '4 min read', type: 'article' },
      { title: 'Building a knowledge base from PDFs', duration: '6 min read', type: 'article' },
      { title: 'Tone and personality settings', duration: '3 min read', type: 'article' },
    ],
  },
  {
    category: 'Workflows & Automation',
    items: [
      { title: 'Task Assignment workflow: end to end', duration: '10 min read', type: 'article' },
      { title: 'Setting up payment reminders', duration: '7 min read', type: 'article' },
      { title: 'Multi-agent orchestration basics', duration: '12 min read', type: 'article' },
    ],
  },
  {
    category: 'India-Specific Guides',
    items: [
      { title: 'GST invoice generation with InvoiceBot', duration: '8 min read', type: 'article' },
      { title: 'WhatsApp Business API vs Evolution API', duration: '5 min read', type: 'article' },
      { title: 'TRAI compliance for SMS and calls', duration: '6 min read', type: 'article' },
    ],
  },
  {
    category: 'Billing & Subscriptions',
    items: [
      { title: 'Understanding usage limits and packs', duration: '4 min read', type: 'article' },
      { title: 'Razorpay UPI billing setup', duration: '5 min read', type: 'article' },
    ],
  },
]

export default function AcademyPage() {
  const [search, setSearch] = useState('')

  const filtered = guides
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())),
    }))
    .filter((cat) => cat.items.length > 0)

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen size={24} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Academy</h1>
        </div>
        <p className="text-gray-600">Guides, tutorials, and best practices for diyaa.ai</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search guides..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Guides */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p>No guides found for &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filtered.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{cat.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        {item.type === 'video' ? (
                          <Play size={16} className="text-blue-600" />
                        ) : (
                          <BookOpen size={16} className="text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm leading-snug mb-2">
                          {item.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{item.duration}</span>
                          <ChevronRight
                            size={14}
                            className="text-gray-400 group-hover:text-blue-600 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Community CTA */}
      <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <h3 className="text-xl font-bold mb-2">Join the diyaa.ai Community</h3>
        <p className="text-blue-100 mb-4">
          Connect with other business owners using AI agents. Share tips, get help, and stay
          updated.
        </p>
        <button className="bg-white text-blue-600 font-semibold px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors">
          Join WhatsApp Community →
        </button>
      </div>
    </div>
  )
}
