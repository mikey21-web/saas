'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

interface WhatsAppWidgetProps {
  phoneNumber: string // e.g., "919876543210"
  agentName?: string // e.g., "Clothing Support"
  welcomeMessage?: string
  position?: 'bottom-right' | 'bottom-left'
  backgroundColor?: string
  textColor?: string
}

export function WhatsAppWidget({
  phoneNumber,
  agentName = 'Support',
  welcomeMessage = 'Hi! How can we help you?',
  position = 'bottom-right',
  backgroundColor = '#25D366', // WhatsApp green
  textColor = '#ffffff',
}: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isVisible = true

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  }

  const openWhatsApp = () => {
    const message = `Hi, I'm interested in learning more about your products!`
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  if (!isVisible) return null

  return (
    <>
      {/* Chat Bubble */}
      {isOpen && (
        <div
          className={`fixed ${positionClasses[position]} mb-20 w-80 rounded-lg shadow-2xl animate-fadeIn`}
          style={{
            background: '#ffffff',
            border: `2px solid ${backgroundColor}`,
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            className="p-4 rounded-t-lg flex items-center justify-between"
            style={{ background: backgroundColor, color: textColor }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <div>
                <p className="font-semibold text-sm">{agentName}</p>
                <p className="text-xs opacity-90">Usually responds instantly</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:opacity-80 transition-opacity"
            >
              <X size={18} />
            </button>
          </div>

          {/* Message */}
          <div className="p-4">
            <p className="text-sm text-gray-800 mb-4">{welcomeMessage}</p>
            <button
              onClick={openWhatsApp}
              className="w-full py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: backgroundColor }}
            >
              💬 Open WhatsApp
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 text-center">
            <p className="text-xs text-gray-500">
              Powered by{' '}
              <a
                href="https://diyaa.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 font-semibold hover:underline"
              >
                diyaa.ai
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${positionClasses[position]} w-14 h-14 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center text-white font-semibold text-xl z-9999`}
        style={{
          background: backgroundColor,
          zIndex: 9998,
          cursor: 'pointer',
        }}
        title={`Chat with ${agentName}`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  )
}
