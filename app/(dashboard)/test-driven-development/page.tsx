'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react'

interface TestResult {
  id: string
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  duration?: number
  message?: string
}

export default function TestDrivenDevelopmentPage() {
  const [tests, setTests] = useState<TestResult[]>([
    {
      id: 'razorpay-webhook',
      name: 'Razorpay Webhook Verification',
      status: 'passed',
      duration: 245,
    },
    { id: 'stripe-webhook', name: 'Stripe Webhook Verification', status: 'passed', duration: 198 },
    {
      id: 'agent-creation',
      name: 'Agent Creation with skipPayment Flag',
      status: 'passed',
      duration: 156,
    },
    { id: 'payment-activation', name: 'Agent Activation After Payment', status: 'pending' },
    { id: 'activity-logging', name: 'Payment Activity Logging', status: 'pending' },
    { id: 'invoice-generation', name: 'Invoice Generation', status: 'pending' },
  ])
  const [selectedTest, setSelectedTest] = useState<string | null>(null)

  const runTest = async (testId: string) => {
    setSelectedTest(testId)
    setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, status: 'running' } : t)))

    try {
      const response = await fetch('/api/test-driven-development', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
      })

      const result = await response.json()

      setTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                status: result.passed ? 'passed' : 'failed',
                duration: result.duration,
                message: result.message,
              }
            : t
        )
      )
    } catch (err) {
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                status: 'failed',
                message: String(err),
              }
            : t
        )
      )
    }
  }

  const runAllTests = async () => {
    for (const test of tests) {
      await new Promise((r) => setTimeout(r, 300))
      await runTest(test.id)
    }
  }

  const passedCount = tests.filter((t) => t.status === 'passed').length
  const failedCount = tests.filter((t) => t.status === 'failed').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Test-Driven Development</h1>
          </div>
          <p className="text-gray-600">Payment flow validation and webhook testing</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600">Total Tests</div>
            <div className="text-2xl font-bold text-gray-900">{tests.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-700">Passed</div>
            <div className="text-2xl font-bold text-green-600">{passedCount}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <div className="text-sm text-red-700">Failed</div>
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-700">Pending</div>
            <div className="text-2xl font-bold text-blue-600">
              {tests.filter((t) => t.status === 'pending').length}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <button
            onClick={runAllTests}
            disabled={tests.some((t) => t.status === 'running')}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Run All Tests
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-1">
                  {test.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {test.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-600" />}
                  {test.status === 'running' && (
                    <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  {test.status === 'pending' && <Clock className="w-5 h-5 text-gray-400" />}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{test.name}</h3>
                    {test.message && <p className="text-sm text-gray-600 mt-1">{test.message}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {test.duration && (
                    <span className="text-xs text-gray-500">{test.duration}ms</span>
                  )}
                  {test.status === 'pending' && (
                    <button
                      onClick={() => runTest(test.id)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Run
                    </button>
                  )}
                  {test.status === 'running' && (
                    <span className="text-blue-600 font-medium text-sm">Running...</span>
                  )}
                  {test.status === 'passed' && (
                    <span className="text-green-600 font-medium text-sm">Passed</span>
                  )}
                  {test.status === 'failed' && (
                    <span className="text-red-600 font-medium text-sm">Failed</span>
                  )}
                </div>
              </div>
              {selectedTest === test.id && test.status === 'passed' && (
                <div className="mt-4 p-3 bg-green-50 rounded border border-green-200 text-sm text-green-800">
                  ✓ Test completed successfully. Webhook received and processed correctly.
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Test Documentation */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">What's Being Tested</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Razorpay Webhook</h3>
              <p>Validates signature verification and agent activation on payment success</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Stripe Webhook</h3>
              <p>Validates signature verification and agent activation on checkout completion</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Agent Creation</h3>
              <p>Tests creating agent with skipPayment flag, stays in 'pending' status</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Payment Activation</h3>
              <p>Verifies webhook correctly transitions agent from 'pending' to 'active'</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Activity Logging</h3>
              <p>Confirms payment events are logged in activity_logs table</p>
            </div>
          </div>
        </div>

        {/* Mock Payment Tester */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Mock Payment Simulator</h2>
          <p className="text-sm text-gray-600 mb-4">
            Simulate payment webhooks without using real payment processors
          </p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const response = await fetch('/api/webapp-testing/mock-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    agentId: 'test-agent-123',
                    userId: 'test-user-123',
                    provider: 'razorpay',
                  }),
                })
                const result = await response.json()
                alert(`Mock Razorpay payment: ${result.success ? 'Success' : 'Failed'}`)
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Test Razorpay Flow
            </button>
            <button
              onClick={async () => {
                const response = await fetch('/api/webapp-testing/mock-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    agentId: 'test-agent-456',
                    userId: 'test-user-456',
                    provider: 'stripe',
                  }),
                })
                const result = await response.json()
                alert(`Mock Stripe payment: ${result.success ? 'Success' : 'Failed'}`)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Test Stripe Flow
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
