'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'

const skills = [
  { id: 'send_whatsapp', name: 'Send WhatsApp', category: 'Communication', icon: '💬', desc: 'Send WhatsApp messages via Evolution API', type: 'api' },
  { id: 'send_email', name: 'Send Email', category: 'Communication', icon: '📧', desc: 'Send emails via Resend with great deliverability', type: 'api' },
  { id: 'send_sms', name: 'Send SMS', category: 'Communication', icon: '📱', desc: 'Send SMS via Exotel (India +91 compliant)', type: 'api' },
  { id: 'make_call', name: 'Make Phone Call', category: 'Communication', icon: '📞', desc: 'Initiate outbound calls via Exotel', type: 'api' },
  { id: 'web_search', name: 'Web Search', category: 'Research', icon: '🔍', desc: 'Search the web using Serper API', type: 'api' },
  { id: 'scrape_url', name: 'Scrape URL', category: 'Research', icon: '🌐', desc: 'Extract content from any webpage', type: 'browser' },
  { id: 'summarise_document', name: 'Summarise Document', category: 'AI', icon: '📝', desc: 'Summarise long text using AI', type: 'prompt' },
  { id: 'gst_lookup', name: 'GST Lookup', category: 'Indian Business', icon: '🏛️', desc: 'Verify GSTIN from GSTN', type: 'api' },
  { id: 'generate_invoice', name: 'Generate Invoice', category: 'Indian Business', icon: '🧾', desc: 'Generate GST-compliant invoice PDF', type: 'code' },
  { id: 'calculate_gst', name: 'Calculate GST', category: 'Indian Business', icon: '🔢', desc: 'Calculate CGST + SGST or IGST', type: 'code' },
  { id: 'upi_payment_link', name: 'UPI Payment Link', category: 'Finance', icon: '₹', desc: 'Create Razorpay payment links', type: 'api' },
  { id: 'write_cold_email', name: 'Write Cold Email', category: 'Sales', icon: '✉️', desc: 'Generate personalised cold emails using AI', type: 'prompt' },
  { id: 'linkedin_outreach', name: 'LinkedIn Outreach', category: 'Sales', icon: '💼', desc: 'Send LinkedIn messages via PhantomBuster', type: 'api' },
  { id: 'post_twitter', name: 'Post to Twitter/X', category: 'Marketing', icon: '🐦', desc: 'Post tweets or threads', type: 'api' },
  { id: 'post_linkedin', name: 'Post to LinkedIn', category: 'Marketing', icon: '💼', desc: 'Publish LinkedIn posts or articles', type: 'api' },
  { id: 'whatsapp_broadcast', name: 'WhatsApp Broadcast', category: 'Marketing', icon: '📣', desc: 'Send to multiple WhatsApp contacts at once', type: 'api' },
  { id: 'google_sheets_read', name: 'Read Google Sheets', category: 'Data', icon: '📊', desc: 'Read data from Google Sheets', type: 'api' },
  { id: 'google_sheets_write', name: 'Write Google Sheets', category: 'Data', icon: '✏️', desc: 'Append or update spreadsheet rows', type: 'api' },
  { id: 'read_email', name: 'Read Email Inbox', category: 'Communication', icon: '📬', desc: 'Fetch and parse recent emails via IMAP', type: 'api' },
  { id: 'schedule_job', name: 'Schedule a Job', category: 'Operations', icon: '⏰', desc: 'Schedule BullMQ jobs at specific times', type: 'code' },
  { id: 'trigger_n8n', name: 'Trigger n8n Workflow', category: 'Operations', icon: '⚡', desc: 'Trigger automation workflows via webhook', type: 'api' },
  { id: 'http_request', name: 'HTTP Request', category: 'Operations', icon: '🔗', desc: 'Make custom API calls to any endpoint', type: 'api' },
  { id: 'translate_text', name: 'Translate Text', category: 'AI', icon: '🌍', desc: 'Translate between Hindi, Tamil, Telugu, etc.', type: 'api' },
  { id: 'generate_image', name: 'Generate Image', category: 'AI', icon: '🎨', desc: 'Generate images using Gemini Vision', type: 'api' },
  { id: 'send_slack', name: 'Send Slack Message', category: 'Communication', icon: '💬', desc: 'Send messages to Slack channels', type: 'api' },
  { id: 'notify_telegram', name: 'Notify Telegram', category: 'Communication', icon: '✈️', desc: 'Send Telegram bot notifications', type: 'api' },
  { id: 'read_pdf', name: 'Read PDF', category: 'Data', icon: '📄', desc: 'Extract text from PDF documents', type: 'code' },
  { id: 'check_pan', name: 'Check PAN / GSTIN', category: 'Indian Business', icon: '🪪', desc: 'Verify PAN or GSTIN via government APIs', type: 'api' },
  { id: 'search_indiamart', name: 'Search IndiaMART', category: 'Indian Business', icon: '🔎', desc: 'Find suppliers or products on IndiaMART', type: 'api' },
  { id: 'calendar_schedule', name: 'Schedule Calendar', category: 'Operations', icon: '📅', desc: 'Create Google Calendar events', type: 'api' },
  { id: 'razorpay_subscription', name: 'Razorpay Subscription', category: 'Finance', icon: '🔄', desc: 'Create recurring subscription plans', type: 'api' },
]

const categories = ['All', ...new Set(skills.map(s => s.category))]
const typeColor: Record<string, string> = {
  api: 'bg-blue-100 text-blue-700',
  prompt: 'bg-purple-100 text-purple-700',
  browser: 'bg-green-100 text-green-700',
  code: 'bg-orange-100 text-orange-700',
}

export default function SkillsPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [installed, setInstalled] = useState<Set<string>>(new Set(['send_whatsapp', 'send_email', 'web_search']))

  const filtered = useMemo(() => skills.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || s.category === category
    return matchSearch && matchCat
  }), [search, category])

  const toggle = (id: string) => {
    setInstalled(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Marketplace</h1>
        <p className="text-gray-600">30 built-in skills — install any on your agents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-gray-900">{skills.length}</p>
          <p className="text-sm text-gray-600">Available Skills</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-blue-600">{installed.size}</p>
          <p className="text-sm text-gray-600">Installed</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-gray-400">480+</p>
          <p className="text-sm text-gray-600">Coming Soon</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(skill => (
          <div key={skill.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{skill.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{skill.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor[skill.type]}`}>
                    {skill.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggle(skill.id)}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                  installed.has(skill.id)
                    ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {installed.has(skill.id) ? '✓ Installed' : 'Install'}
              </button>
            </div>
            <p className="text-xs text-gray-600">{skill.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
