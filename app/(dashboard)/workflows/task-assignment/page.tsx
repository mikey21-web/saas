'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/auth/client'

interface Task {
  title: string
  description: string
  priority: string
}

interface Assignment {
  taskTitle: string
  assignedTo: string
  reason: string
}

interface WorkflowResult {
  success: boolean
  executionId: string
  output: {
    tasksExtracted: Task[]
    taskAssignments: Assignment[]
    notificationsSent: Array<{ recipient: string; channel: string; status: string }>
    taskIdsCreated: string[]
    report: string
  }
  errors: string[]
}

export default function TaskAssignmentPage() {
  const [agentId, setAgentId] = useState('')
  const [meetingNotes, setMeetingNotes] = useState('')
  const [teamMembers, setTeamMembers] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<WorkflowResult | null>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'input' | 'executing' | 'result'>('input')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleExecute = async () => {
    if (!agentId || !meetingNotes || !teamMembers) {
      setError('Please fill in all fields')
      return
    }

    setError('')
    setLoading(true)
    setStep('executing')

    try {
      const membersList = teamMembers
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)

      if (membersList.length === 0) {
        throw new Error('Please provide at least one team member')
      }

      const response = await authFetch('/api/workflows/task-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          meetingNotes,
          teamMembers: membersList,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Workflow execution failed')
      }

      const data = (await response.json()) as WorkflowResult
      setResult(data)
      setStep('result')
    } catch (err) {
      setError(String(err))
      setLoading(false)
    }
  }

  if (step === 'executing' && loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <div className="inline-block">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Executing Workflow</h2>
          <p className="text-gray-600 mb-8">Running 5-agent orchestration...</p>

          {/* Agent Status */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-700">Parser Agent: Extracting tasks...</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-300 rounded-full" />
              <span className="text-gray-500">Router Agent: Assigning tasks...</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-300 rounded-full" />
              <span className="text-gray-500">Notifier Agent: Sending notifications...</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-300 rounded-full" />
              <span className="text-gray-500">Tracker Agent: Creating tasks...</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-300 rounded-full" />
              <span className="text-gray-500">Reporter Agent: Generating report...</span>
            </div>
          </div>

          <p className="text-sm text-gray-500">This may take a few seconds...</p>
          <div ref={messagesEndRef} />
        </div>
      </div>
    )
  }

  if (step === 'result' && result) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Banner */}
        {result.success && (
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">✅</span>
              <h2 className="text-xl font-bold text-green-900">Workflow Completed Successfully!</h2>
            </div>
            <p className="text-green-800">
              {result.output.taskIdsCreated.length} tasks created and notifications sent
            </p>
          </div>
        )}

        {/* Errors */}
        {result.errors.length > 0 && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-bold text-red-900 mb-2">⚠️ Issues encountered:</h3>
            <ul className="space-y-1 text-sm text-red-800">
              {result.errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tasks Extracted */}
        {result.output.tasksExtracted.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">
              📋 Tasks Extracted ({result.output.tasksExtracted.length})
            </h3>
            <div className="space-y-3">
              {result.output.tasksExtracted.map((task, i) => (
                <div key={i} className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        task.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments */}
        {result.output.taskAssignments.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">
              👥 Task Assignments ({result.output.taskAssignments.length})
            </h3>
            <div className="space-y-3">
              {result.output.taskAssignments.map((assignment, i) => (
                <div key={i} className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">{assignment.taskTitle}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Assigned to:</strong> {assignment.assignedTo}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    <em>{assignment.reason}</em>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications */}
        {result.output.notificationsSent.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">📨 Notifications Sent</h3>
            <div className="space-y-2">
              {result.output.notificationsSent.map((notif, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className={`text-lg ${notif.status === 'sent' ? '✅' : '❌'}`} />
                  <span className="text-sm text-gray-600">
                    {notif.recipient} via <strong>{notif.channel}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report */}
        {result.output.report && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">📊 Evening Report</h3>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {result.output.report}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Link
            href="/dashboard"
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 font-medium text-center"
          >
            ← Back to Dashboard
          </Link>
          <Link
            href={`/agents/${agentId}`}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center"
          >
            View Agent Tasks →
          </Link>
          <button
            onClick={() => {
              setStep('input')
              setResult(null)
              setMeetingNotes('')
            }}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium"
          >
            Run Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Assignment Workflow</h1>
        <p className="text-gray-600">
          Convert meeting notes into tasks and assign to team members automatically
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        {/* Agent Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Select Task Assignment Agent
          </label>
          <input
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Enter agent ID or select from store"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Don't have one?{' '}
            <Link href="/store" className="text-blue-600 hover:underline">
              Deploy Task Assignment from store
            </Link>
          </p>
        </div>

        {/* Meeting Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Meeting Notes or Task Input
          </label>
          <textarea
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            placeholder="Paste your Monday meeting transcript, email, or task description here. The Parser Agent will extract tasks automatically."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Tip: Include context like who should do what and by when for better assignments
          </p>
        </div>

        {/* Team Members */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Team Members (comma-separated)
          </label>
          <input
            type="text"
            value={teamMembers}
            onChange={(e) => setTeamMembers(e.target.value)}
            placeholder="e.g., John Doe, Sarah, dev-team@company.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            The Router Agent will match tasks to the best person
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={loading || !agentId || !meetingNotes || !teamMembers}
          className={`w-full py-4 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2 ${
            loading || !agentId || !meetingNotes || !teamMembers
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running 5-Agent Workflow...
            </>
          ) : (
            '🚀 Execute Workflow'
          )}
        </button>

        {/* Workflow Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-2">How it works:</p>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>
              <strong>Parser Agent</strong> extracts tasks from your notes
            </li>
            <li>
              <strong>Router Agent</strong> assigns tasks to best-fit team members
            </li>
            <li>
              <strong>Notifier Agent</strong> sends WhatsApp/email notifications
            </li>
            <li>
              <strong>Tracker Agent</strong> creates tasks and sets up monitoring
            </li>
            <li>
              <strong>Reporter Agent</strong> generates an evening summary
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
