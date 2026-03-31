'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const NEXT_STEPS = [
  { icon: '📋', title: 'Add Knowledge Base', desc: 'Upload your product catalog, FAQs, or paste your website URL', href: '#', action: 'knowledge' },
  { icon: '📱', title: 'Connect WhatsApp', desc: 'Link your WhatsApp Business number to start receiving messages', href: '#', action: 'whatsapp' },
  { icon: '✉️', title: 'Set Up Email', desc: 'Connect your business email for auto-replies', href: '#', action: 'email' },
  { icon: '💬', title: 'Test Your Agent', desc: 'Chat with your agent before going live', href: '#', action: 'test' },
]

export default function OnboardSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const agentId = searchParams.get('agentId') || ''
  const agentName = searchParams.get('agentName') || 'Your Agent'
  const icon = searchParams.get('icon') || '🤖'

  const [showConfetti, setShowConfetti] = useState(false)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    setShowConfetti(true)
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer)
          router.push(`/agents/${agentId}`)
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [agentId, router])

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Celebration Header */}
      <div className={`transition-all duration-700 ${showConfetti ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-7xl mb-4 animate-bounce">{icon}</div>
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold mb-4" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
          Agent is LIVE
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#f0eff0' }}>
          🎉 {agentName} is deployed!
        </h1>
        <p className="mb-8" style={{ color: '#71717a' }}>
          Your AI agent is now live and ready to work for your business 24/7.
          <br />No more missed leads, no more manual follow-ups.
        </p>
      </div>

      {/* Agent Status Card */}
      <div className="rounded-2xl p-6 mb-8 text-left border" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(232,121,249,0.05)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{icon}</div>
            <div>
              <h3 className="font-bold" style={{ color: '#f0eff0' }}>{agentName}</h3>
              <p className="text-xs" style={{ color: '#71717a' }}>Agent ID: {agentId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
            Active
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-2xl font-bold" style={{ color: '#e879f9' }}>0</p>
            <p className="text-xs" style={{ color: '#71717a' }}>Conversations</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-2xl font-bold" style={{ color: '#e879f9' }}>0</p>
            <p className="text-xs" style={{ color: '#71717a' }}>Tasks Completed</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-2xl font-bold" style={{ color: '#10b981' }}>₹0</p>
            <p className="text-xs" style={{ color: '#71717a' }}>Revenue Influenced</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mb-8 text-left">
        <h2 className="font-bold mb-4 text-lg" style={{ color: '#f0eff0' }}>Complete setup to unlock full power:</h2>
        <div className="space-y-3">
          {NEXT_STEPS.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl p-4 transition-all cursor-pointer group border"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)'
              }}
              onClick={() => router.push(`/agents/${agentId}?tab=${step.action}`)}
            >
              <div className="text-2xl">{step.icon}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm transition-colors" style={{ color: '#f0eff0' }}>{step.title}</p>
                <p className="text-xs" style={{ color: '#71717a' }}>{step.desc}</p>
              </div>
              <div style={{ color: '#71717a' }}>→</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-3">
        <Link
          href={`/agents/${agentId}`}
          className="flex-1 text-white font-bold py-3 rounded-xl text-sm transition-all"
          style={{ background: '#e879f9', color: '#0c0c0d' }}
        >
          View Agent Dashboard →
        </Link>
        <Link
          href="/store"
          className="flex-1 font-bold py-3 rounded-xl text-sm transition-all border"
          style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#71717a' }}
        >
          Deploy Another Agent
        </Link>
      </div>

      <p className="text-xs mt-4" style={{ color: '#71717a' }}>
        Redirecting to agent dashboard in {countdown}s...
      </p>
    </div>
  )
}
