'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Copy, Check } from 'lucide-react'
import { AGENT_CATALOG, AgentType } from '@/lib/agents/all-prompts'
import { authFetch } from '@/lib/auth/client'

export default function AgentEmbedPage() {
  const params = useParams()
  const agentId = params.id as string
  const [agent, setAgent] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#e879f9')
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right')
  const [welcomeMsg, setWelcomeMsg] = useState('')

  useEffect(() => {
    authFetch(`/api/agents/${agentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAgent(d.agent))
  }, [agentId])

  const agentType: AgentType = (agent?.template_id as AgentType) || 'customersupport'
  const catalog = AGENT_CATALOG.find((a) => a.type === agentType)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://diyaa.ai'

  const embedCode = `<!-- diyaa.ai ${catalog?.name || 'AI'} Widget -->
<script>
  window.DiyaaAgent = {
    agentId: '${agentId}',
    agentType: '${agentType}',
    businessName: '${agent?.name || 'Support'}',
    welcomeMessage: '${welcomeMsg || `Hi! I'm ${agent?.name || 'your AI assistant'}. How can I help?`}',
    primaryColor: '${primaryColor}',
    position: '${position}',
    apiBase: '${appUrl}'
  };
</script>
<script src="${appUrl}/diyaa-agent-widget.js" defer></script>`

  const copy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ background: '#0c0c0d', minHeight: '100vh' }} className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{catalog?.icon || '🤖'}</span>
            <h1 className="text-3xl font-bold" style={{ color: '#f0eff0' }}>
              Embed {catalog?.name || 'Agent'} Widget
            </h1>
          </div>
          <p style={{ color: '#71717a' }}>
            Add an AI chat button to any website — WordPress, HTML, Shopify, React, Wix
          </p>
        </div>

        {/* Customise */}
        <div
          className="p-6 rounded-xl mb-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: '#f0eff0' }}>
            Customise
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#71717a' }}>
                Welcome Message
              </label>
              <input
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                placeholder={`Hi! How can I help?`}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f0eff0',
                }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#71717a' }}>
                Button Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 rounded cursor-pointer"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f0eff0',
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#71717a' }}>
                Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f0eff0',
                }}
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          </div>
        </div>

        {/* Embed Code */}
        <div
          className="p-6 rounded-xl mb-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: '#f0eff0' }}>
              Embed Code
            </h2>
            <button
              onClick={copy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: '#e879f9', color: '#0c0c0d' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre
            className="p-4 rounded-lg text-xs overflow-x-auto"
            style={{
              background: 'rgba(0,0,0,0.4)',
              color: '#a1a1aa',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {embedCode}
          </pre>
          <p className="text-xs mt-3" style={{ color: '#71717a' }}>
            Paste this code before the <code style={{ color: '#e879f9' }}>&lt;/body&gt;</code> tag
            on your website
          </p>
        </div>

        {/* Steps */}
        <div
          className="p-6 rounded-xl mb-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: '#f0eff0' }}>
            How to Add It
          </h2>
          <div className="space-y-4">
            {[
              {
                platform: 'WordPress',
                steps: 'Appearance → Theme File Editor → footer.php → paste before </body>',
              },
              {
                platform: 'Shopify',
                steps: 'Online Store → Themes → Edit Code → theme.liquid → paste before </body>',
              },
              { platform: 'Wix', steps: 'Settings → Custom Code → Add Code → Body - end' },
              { platform: 'HTML', steps: 'Open your HTML file → paste before </body> → save' },
              {
                platform: 'Next.js / React',
                steps: 'Use the <AgentWidget> React component directly instead',
              },
            ].map((item) => (
              <div key={item.platform} className="flex gap-4">
                <span
                  className="text-xs font-semibold w-24 flex-shrink-0 pt-0.5"
                  style={{ color: '#e879f9' }}
                >
                  {item.platform}
                </span>
                <span className="text-sm" style={{ color: '#71717a' }}>
                  {item.steps}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div
          className="p-6 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: '#f0eff0' }}>
            Live Preview
          </h2>
          <div
            className="rounded-xl relative h-64 flex items-start p-4"
            style={{ background: '#f0f0f0', border: '1px solid #ddd' }}
          >
            <p className="text-sm" style={{ color: '#888' }}>
              📱 Your website here...
            </p>
            {/* Simulated button */}
            <div
              className="absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform"
              style={{ background: primaryColor }}
              title="This is how the button looks"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: '#71717a' }}>
            The {catalog?.icon} button appears at {position.replace('-', ' ')}. Visitors click it to
            chat with your AI agent.
          </p>
        </div>
      </div>
    </div>
  )
}
