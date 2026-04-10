'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents')
        if (res.ok) {
          const data = await res.json()
          setAgents(data.agents || [])
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Your Agents</h1>
        <p className="text-gray-600 mt-2">Manage and monitor your AI agents</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold mb-4">No Agents Yet</h2>
          <p className="text-gray-600 mb-6">Create your first AI agent to get started</p>
          <Link
            href="/store"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Agent Store
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent: any) => (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <div className="p-4 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-sm text-gray-600">{agent.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
