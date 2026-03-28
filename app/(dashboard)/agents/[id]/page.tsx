'use client'

import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AgentDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const agentId = params.id as string
  const isSuccess = searchParams.get('success') === 'true'

  return (
    <div>
      {isSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✓ Agent deployed successfully!</p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Details</h1>
        <p className="text-gray-600">Agent ID: {agentId}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-5 border-b border-gray-200">
          {['Overview', 'Conversations', 'Knowledge', 'Settings', 'Analytics'].map((tab) => (
            <button
              key={tab}
              className="px-4 py-4 text-center font-medium text-gray-700 hover:bg-gray-50 border-b-2 border-transparent hover:border-gray-300"
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Agent Status</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Today's Activity</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Messages Received</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Responses Sent</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Cost Used</p>
                  <p className="text-2xl font-bold text-gray-900">₹0</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Next Steps</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Agent deployed to {agentId}</li>
                <li className="text-gray-400">⟳ Waiting for first message...</li>
                <li className="text-gray-400">📊 View conversations and analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <Link
          href="/dashboard"
          className="px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium"
        >
          ← Back to Dashboard
        </Link>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
          Copy Agent Link
        </button>
      </div>
    </div>
  )
}
