'use client'

import { useState } from 'react'
import { Copy, Download, RefreshCw } from 'lucide-react'

export default function WebappTestingPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const thunderClientCollection = {
    name: 'diyaa.ai Payment Testing',
    items: [
      {
        name: 'Create Agent (skipPayment)',
        request: {
          method: 'POST',
          url: 'http://localhost:3000/api/onboard/deploy',
          body: {
            agentType: 'LeadCatcher',
            agentIcon: '🎯',
            config: {
              businessName: 'Test Business',
              industry: 'Sales',
              products: 'Test Product',
              targetCustomers: 'Test Customers',
              tone: 'friendly',
              language: 'English',
              agentPersonality: 'Helpful',
              activeHours: '9:00-21:00',
              keyInstructions: 'Be helpful',
              agentName: 'Test Agent',
            },
            userId: 'test-user-123',
            plan: 'agent',
            skipPayment: true,
          },
        },
      },
      {
        name: 'Mock Razorpay Webhook',
        request: {
          method: 'POST',
          url: 'http://localhost:3000/api/webhooks/razorpay',
          headers: {
            'x-razorpay-signature': 'test-signature',
          },
          body: {
            event: 'payment.authorized',
            payload: {
              payment: {
                entity: {
                  id: 'pay_test_123',
                  status: 'captured',
                  notes: {
                    userId: 'test-user-123',
                    agentId: 'test-agent-123',
                    plan: 'agent',
                  },
                },
              },
            },
          },
        },
      },
      {
        name: 'Mock Stripe Webhook',
        request: {
          method: 'POST',
          url: 'http://localhost:3000/api/webhooks/stripe',
          headers: {
            'stripe-signature': 'test-signature',
          },
          body: {
            type: 'checkout.session.completed',
            data: {
              object: {
                id: 'cs_test_123',
                payment_status: 'paid',
                amount_total: 499900,
                currency: 'inr',
                client_reference_id: 'agent_test-agent-456_test-user-456',
                payment_intent: 'pi_test_123',
                metadata: {
                  plan: 'agent',
                  agent_id: 'test-agent-456',
                  user_id: 'test-user-456',
                },
              },
            },
          },
        },
      },
    ],
  }

  const codeExamples = {
    razorpayTest: `
import fetch from 'node-fetch'

const testRazorpayWebhook = async () => {
  const response = await fetch('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': 'test-sig',
    },
    body: JSON.stringify({
      event: 'payment.authorized',
      payload: {
        payment: {
          entity: {
            id: 'pay_123',
            status: 'captured',
            notes: {
              userId: 'user-123',
              agentId: 'agent-123',
              plan: 'agent',
            },
          },
        },
      },
    }),
  })
  console.log(await response.json())
}

testRazorpayWebhook()
    `.trim(),

    stripeTest: `
import fetch from 'node-fetch'

const testStripeWebhook = async () => {
  const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': 'test-sig',
    },
    body: JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        object: {
          payment_status: 'paid',
          amount_total: 499900,
          currency: 'inr',
          client_reference_id: 'agent_agent-123_user-123',
          metadata: {
            plan: 'agent',
            agent_id: 'agent-123',
            user_id: 'user-123',
          },
        },
      },
    }),
  })
  console.log(await response.json())
}

testStripeWebhook()
    `.trim(),

    agentCreation: `
import fetch from 'node-fetch'

const createAgent = async () => {
  const response = await fetch('http://localhost:3000/api/onboard/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentType: 'LeadCatcher',
      agentIcon: '🎯',
      config: {
        businessName: 'Test Business',
        industry: 'Sales',
        products: 'Test',
        targetCustomers: 'Test',
        tone: 'friendly',
        language: 'English',
        agentPersonality: 'Helpful',
        activeHours: '9:00-21:00',
        keyInstructions: 'Help users',
        agentName: 'Test Agent',
      },
      userId: 'user-123',
      plan: 'agent',
      skipPayment: true,
    }),
  })
  const data = await response.json()
  console.log('Agent created:', data.agentId)
  return data.agentId
}

createAgent()
    `.trim(),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">WebApp Testing Guide</h1>
          <p className="text-gray-600">Complete API testing documentation for payment flows</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <a
            href="/test-driven-development"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Test Dashboard
          </a>
          <button
            onClick={() => {
              const json = JSON.stringify(thunderClientCollection, null, 2)
              const blob = new Blob([json], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'diyaa-ai-thunder-client.json'
              a.click()
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center gap-2 justify-center"
          >
            <Download className="w-4 h-4" />
            Export Thunder Client Collection
          </button>
        </div>

        {/* Testing Sections */}
        <div className="space-y-8">
          {/* Agent Creation Test */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Create Agent with skipPayment
            </h2>
            <p className="text-gray-600 mb-4">
              First step: Create an agent in 'pending' status before payment
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <pre className="text-xs overflow-x-auto">
                <code>{`POST /api/onboard/deploy
Content-Type: application/json

{
  "agentType": "LeadCatcher",
  "agentIcon": "🎯",
  "config": {
    "businessName": "Test Business",
    "industry": "Sales",
    "products": "Test",
    "targetCustomers": "Test",
    "tone": "friendly",
    "language": "English",
    "agentPersonality": "Helpful",
    "activeHours": "9:00-21:00",
    "keyInstructions": "Help users",
    "agentName": "Test Agent"
  },
  "userId": "test-user-123",
  "plan": "agent",
  "skipPayment": true
}`}</code>
              </pre>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(codeExamples.agentCreation, 'agent-create')}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied === 'agent-create' ? 'Copied!' : 'Copy Node.js Example'}
              </button>
            </div>
          </div>

          {/* Razorpay Webhook Test */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Razorpay Webhook (INR Payments)
            </h2>
            <p className="text-gray-600 mb-4">
              Test payment received webhook that activates the agent
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <pre className="text-xs overflow-x-auto">
                <code>{`POST /api/webhooks/razorpay
x-razorpay-signature: [SIGNATURE]
Content-Type: application/json

{
  "event": "payment.authorized",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_test_123",
        "status": "captured",
        "notes": {
          "userId": "test-user-123",
          "agentId": "[AGENT_ID_FROM_STEP_1]",
          "plan": "agent"
        }
      }
    }
  }
}`}</code>
              </pre>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(codeExamples.razorpayTest, 'razorpay-test')}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied === 'razorpay-test' ? 'Copied!' : 'Copy Node.js Example'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Expected: Agent status changes from 'pending' → 'active', activity logged
            </p>
          </div>

          {/* Stripe Webhook Test */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Stripe Webhook (USD Payments)
            </h2>
            <p className="text-gray-600 mb-4">
              Test checkout completion webhook that activates the agent
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <pre className="text-xs overflow-x-auto">
                <code>{`POST /api/webhooks/stripe
stripe-signature: [SIGNATURE]
Content-Type: application/json

{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_123",
      "payment_status": "paid",
      "amount_total": 499900,
      "currency": "inr",
      "client_reference_id": "agent_[AGENT_ID]_[USER_ID]",
      "payment_intent": "pi_test_123",
      "metadata": {
        "plan": "agent",
        "agent_id": "[AGENT_ID_FROM_STEP_1]",
        "user_id": "[USER_ID]"
      }
    }
  }
}`}</code>
              </pre>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(codeExamples.stripeTest, 'stripe-test')}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied === 'stripe-test' ? 'Copied!' : 'Copy Node.js Example'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Expected: Agent status changes from 'pending' → 'active', activity logged
            </p>
          </div>

          {/* Thunder Client Instructions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Using Thunder Client</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>Install Thunder Client extension (VS Code or standalone)</li>
              <li>Click button above to export the test collection</li>
              <li>Import the JSON file into Thunder Client</li>
              <li>Update placeholder values (USER_ID, AGENT_ID) from your test</li>
              <li>Run requests in order: Create Agent → Razorpay/Stripe Webhook</li>
              <li>Check Supabase to verify agent status changed to 'active'</li>
            </ol>
          </div>

          {/* Expected Results */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Expected Results</h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold text-green-900 mb-2">✓ Agent Creation Success</h3>
                <p className="text-sm text-green-800">
                  Returns: agentId, status 'pending', deployed_at null
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">✓ Webhook Processing</h3>
                <p className="text-sm text-blue-800">
                  Webhook signature verified, agent status updated to 'active', deployed_at set
                </p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                <h3 className="font-semibold text-purple-900 mb-2">✓ Activity Logging</h3>
                <p className="text-sm text-purple-800">
                  Check activity_logs table for payment_received entry with paymentId and plan
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Troubleshooting</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900">Webhook not triggering agent update</h3>
                <p className="text-gray-600">
                  • Ensure client_reference_id format is correct: agent_[agentId]_[userId]
                </p>
                <p className="text-gray-600">• Verify agentId and userId match the created agent</p>
                <p className="text-gray-600">
                  • Check Supabase RLS policies allow service role updates
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Activity not logged</h3>
                <p className="text-gray-600">
                  • Ensure activity_logs table has correct RLS policies
                </p>
                <p className="text-gray-600">
                  • Check user_id in webhook matches the created agent's user_id
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Agent still showing as 'pending'</h3>
                <p className="text-gray-600">
                  • Webhook might have failed silently - check server logs
                </p>
                <p className="text-gray-600">• Verify payload structure matches expected format</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
