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
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-2 text-sm font-semibold mb-4">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Agent is LIVE
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎉 {agentName} is deployed!
        </h1>
        <p className="text-gray-600 mb-8">
          Your AI agent is now live and ready to work for your business 24/7.
          <br />No more missed leads, no more manual follow-ups.
        </p>
      </div>

      {/* Agent Status Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 text-left shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{icon}</div>
            <div>
              <h3 className="font-bold text-gray-900">{agentName}</h3>
              <p className="text-xs text-gray-500">Agent ID: {agentId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Active
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500">Conversations</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500">Tasks Completed</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-blue-600">₹0</p>
            <p className="text-xs text-gray-500">Revenue Influenced</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mb-8 text-left">
        <h2 className="font-bold text-gray-900 mb-4 text-lg">Complete setup to unlock full power:</h2>
        <div className="space-y-3">
          {NEXT_STEPS.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => router.push(`/agents/${agentId}?tab=${step.action}`)}
            >
              <div className="text-2xl">{step.icon}</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{step.title}</p>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
              <div className="text-gray-400 group-hover:text-blue-600 transition-colors">→</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-3">
        <Link
          href={`/agents/${agentId}`}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
        >
          View Agent Dashboard →
        </Link>
        <Link
          href="/store"
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl text-sm transition-colors"
        >
          Deploy Another Agent
        </Link>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Redirecting to agent dashboard in {countdown}s...
      </p>
    </div>
  )
}
