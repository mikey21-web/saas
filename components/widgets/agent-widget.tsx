'use client'

/**
 * Universal Agent Widget — works for all 20 agent types
 * Drop-in React component for any Next.js/React site
 */

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { AGENT_CATALOG, AgentType } from '@/lib/agents/all-prompts'

interface AgentWidgetProps {
  agentId: string
  agentType: AgentType
  businessName?: string
  welcomeMessage?: string
  position?: 'bottom-right' | 'bottom-left'
  primaryColor?: string
  showBranding?: boolean
}

interface Message {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

export function AgentWidget({
  agentId,
  agentType,
  businessName,
  welcomeMessage,
  position = 'bottom-right',
  primaryColor = '#e879f9',
  showBranding = true,
}: AgentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const catalog = AGENT_CATALOG.find((a) => a.type === agentType)
  const displayName = businessName || catalog?.name || 'AI Assistant'
  const defaultWelcome =
    welcomeMessage || `Hi! I'm ${displayName}. ${catalog?.description || 'How can I help you?'}`

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'agent', content: defaultWelcome, timestamp: new Date() }])
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const positionClass = position === 'bottom-right' ? 'right-6' : 'left-6'

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }])
    setIsLoading(true)

    try {
      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType,
          message: userMessage,
          channel: 'widget',
          conversationId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setConversationId(data.conversationId)
        setMessages((prev) => [
          ...prev,
          { role: 'agent', content: data.response, timestamp: new Date() },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'agent',
            content: 'Something went wrong. Please try again.',
            timestamp: new Date(),
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: "I'm offline right now. Please try again shortly.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 ${positionClass} w-80 sm:w-96 rounded-2xl shadow-2xl flex flex-col`}
          style={{
            background: '#ffffff',
            border: `1.5px solid ${primaryColor}33`,
            zIndex: 9999,
            maxHeight: '520px',
          }}
        >
          {/* Header */}
          <div
            className="p-4 rounded-t-2xl flex items-center justify-between"
            style={{ background: primaryColor }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {catalog?.icon || '🤖'}
              </div>
              <div>
                <p className="font-semibold text-sm text-white">{displayName}</p>
                <p className="text-xs text-white/80">Typically replies instantly</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 200 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
                  style={{
                    background: msg.role === 'user' ? primaryColor : '#f3f4f6',
                    color: msg.role === 'user' ? 'white' : '#111827',
                    borderBottomRightRadius: msg.role === 'user' ? 4 : undefined,
                    borderBottomLeftRadius: msg.role === 'agent' ? 4 : undefined,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl px-4 py-2">
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: '#f3f4f6', color: '#111827' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40"
              style={{ background: primaryColor }}
            >
              <Send size={14} className="text-white" />
            </button>
          </div>

          {/* Branding */}
          {showBranding && (
            <div className="px-4 pb-2 text-center">
              <a
                href="https://diyaa.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Powered by diyaa.ai
              </a>
            </div>
          )}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${positionClass} w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95`}
        style={{ background: primaryColor, zIndex: 9998 }}
        title={`Chat with ${displayName}`}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}
      </button>
    </>
  )
}
