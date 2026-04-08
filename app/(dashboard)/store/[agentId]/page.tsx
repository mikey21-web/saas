'use client'

import { useRouter, useParams } from 'next/navigation'
import AgentDetailCard from '@/components/store/agent-detail-card'
import { getAgentDetails } from '@/lib/agents/agent-details'
import { getTemplate } from '@/lib/agents/template-definitions'

export default function AgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.agentId as string

  const template = getTemplate(agentId)
  const details = getAgentDetails(agentId)

  const handleBack = () => {
    router.push('/store')
  }

  const handleSmartDeploy = () => {
    const icon = template?.icon || '🤖'
    const name = template?.name || agentId
    router.push(
      `/onboard/${encodeURIComponent(agentId)}?name=${encodeURIComponent(name)}&icon=${encodeURIComponent(icon)}&plan=agent`
    )
  }

  const handleQuickDeploy = () => {
    const icon = template?.icon || '🤖'
    const name = template?.name || agentId
    router.push(
      `/onboard/${encodeURIComponent(agentId)}?name=${encodeURIComponent(name)}&icon=${encodeURIComponent(icon)}&plan=agent&quick=1`
    )
  }

  if (!template || !details) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p style={{ color: '#f0eff0' }}>Agent not found</p>
        <button onClick={handleBack} className="mt-4 text-blue-600 hover:text-blue-700">
          Back to Store
        </button>
      </div>
    )
  }

  return (
    <AgentDetailCard
      agentId={agentId}
      onBack={handleBack}
      onSmartDeploy={handleSmartDeploy}
      onQuickDeploy={handleQuickDeploy}
    />
  )
}
