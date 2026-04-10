'use client'

import { useState, useEffect } from 'react'
import { Mail, MessageCircle, Send, Check, Loader2, LogOut } from 'lucide-react'
import { authFetch } from '@/lib/auth/client'

interface ChannelStatus {
  channel: 'gmail' | 'whatsapp' | 'telegram'
  connected: boolean
  email?: string
  phoneNumber?: string
  botUsername?: string
}

const CHANNELS = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
    description: 'Read and send emails',
    color: 'from-red-500 to-red-600',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageCircle,
    description: 'Send and receive messages',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: Send,
    description: 'Send and receive messages',
    color: 'from-sky-500 to-sky-600',
  },
]

interface ChannelConnectionsProps {
  agentId: string
}

export default function ChannelConnections({ agentId }: ChannelConnectionsProps) {
  const [channels, setChannels] = useState<ChannelStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    loadChannelStatus()
  }, [agentId])

  const loadChannelStatus = async () => {
    try {
      setLoading(true)
      const res = await authFetch(`/api/channels/status?agentId=${agentId}`)
      if (res.ok) {
        const data = await res.json()
        setChannels(data.channels || [])
      }
    } catch (error) {
      console.error('Failed to load channel status:', error)
    } finally {
      setLoading(false)
    }
  }

  const initiateConnect = (channelId: string) => {
    setConnecting(channelId)
    // Redirect to OAuth authorization endpoint
    window.location.href = `/api/auth/channels/${channelId}/authorize?agentId=${agentId}`
  }

  const disconnect = async (channelId: string) => {
    if (!confirm(`Disconnect ${channelId}?`)) return
    try {
      const res = await authFetch(`/api/channels/${channelId}/disconnect?agentId=${agentId}`, {
        method: 'POST',
      })
      if (res.ok) {
        loadChannelStatus()
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const getChannelStatus = (channelId: string) => {
    return channels.find((c) => c.channel === channelId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Channels</h3>
        <p className="text-sm text-gray-500">
          Link your communication channels to enable your agent to send messages and emails.
        </p>
      </div>

      <div className="space-y-3">
        {CHANNELS.map((channel) => {
          const status = getChannelStatus(channel.id as 'gmail' | 'whatsapp' | 'telegram')
          const isConnected = status?.connected
          const Icon = channel.icon

          return (
            <div
              key={channel.id}
              className="p-4 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${channel.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{channel.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{channel.description}</p>
                    {isConnected && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                        <Check className="w-3 h-3" />
                        <span>
                          {status?.email || status?.phoneNumber || status?.botUsername || 'Connected'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isConnected ? (
                  <button
                    onClick={() => disconnect(channel.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-3 h-3" />
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => initiateConnect(channel.id)}
                    disabled={connecting === channel.id}
                    className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-coral-500 to-coral-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {connecting === channel.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Connect'
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
