'use client'

import type { ElementType } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Cpu,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { authFetch } from '@/lib/auth/client'

type PreviewCard = {
  title: string
  body: string
}

type SimulationExample = {
  title: string
  trigger: string
  outcome: string
}

type RoiSummary = {
  weeklyHours?: string
  monthlyHours?: string
  responseTime?: string
  automationCoverage?: string
} | null

type ActivityItem = {
  id?: string
  title: string
  detail: string
  status: 'queued' | 'in_progress' | 'ready'
  icon: ElementType
}

type PersistedBootTask = {
  id: string
  created_at: string
  title: string
  detail: string
  status: 'queued' | 'in_progress' | 'ready'
  source: string
}

type AgentMetadata = {
  type?: 'intern' | 'agent'
  role?: string
  goal?: string
  websiteUrl?: string
  owner?: {
    name?: string
    email?: string
  }
  connectedTools?: string[]
  integrationDetails?: Record<string, string>
  channels?: string[]
  languages?: string
  mustDo?: string
  mustAvoid?: string
  approvalRules?: string
  autonomyLevel?: string
  successMetric?: string
  importantPeople?: string
  previewCards?: PreviewCard[]
  simulationExamples?: SimulationExample[]
  roiSummary?: RoiSummary
  dayOneTasks?: string[]
}

interface AgentRecord {
  id: string
  name: string
  description?: string
  business_name?: string
  business_industry?: string
  agent_type: string
  status: string
  channels_whatsapp?: boolean
  channels_email?: boolean
  channels_phone?: boolean
  channels_sms?: boolean
  tone?: string
  created_at: string
  deployed_at?: string
  metadata?: AgentMetadata | null
}

function titleCase(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const [agent, setAgent] = useState<AgentRecord | null>(null)
  const [bootTasks, setBootTasks] = useState<PersistedBootTask[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAgent() {
      try {
        setLoading(true)
        setError(null)

        const res = await authFetch(`/api/agents/${agentId}`)
        if (!res.ok) {
          throw new Error('Failed to load agent')
        }

        const data = (await res.json()) as {
          agent?: AgentRecord
          bootTasks?: PersistedBootTask[]
          error?: string
        }
        if (!data.agent) {
          throw new Error(data.error || 'Agent not found')
        }

        setAgent(data.agent)
        setBootTasks(Array.isArray(data.bootTasks) ? data.bootTasks : [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load agent')
      } finally {
        setLoading(false)
      }
    }

    if (agentId) {
      void loadAgent()
    }
  }, [agentId])

  const metadata = (agent?.metadata || {}) as AgentMetadata
  const connectedTools = metadata.connectedTools || []
  const previewCards = metadata.previewCards || []
  const simulationExamples = metadata.simulationExamples || []
  const roiSummary = metadata.roiSummary || null
  const dayOneTasks = metadata.dayOneTasks || []
  const channels = metadata.channels || deriveChannels(agent)
  const typeLabel = metadata.type ? titleCase(metadata.type) : 'Agent'
  const roleLabel = metadata.role ? titleCase(metadata.role) : titleCase(agent?.agent_type || 'agent')

  const valueHeadline = useMemo(() => {
    if (!agent) return ''
    if (metadata.goal) return metadata.goal
    if (agent.description) return agent.description
    return 'Ready to start doing useful work.'
  }, [agent, metadata.goal])

  const nowWorkingItems = useMemo<ActivityItem[]>(() => {
    if (!agent) return []

    if (bootTasks.length > 0) {
      return bootTasks.map((task) => ({
        id: task.id,
        title: task.title,
        detail: task.detail,
        status: task.status,
        icon: iconForBootTask(task.source),
      }))
    }

    const items: ActivityItem[] = []
    const integrationEntries = Object.entries(metadata.integrationDetails || {}).filter(([, value]) =>
      Boolean(value?.trim())
    )

    if (integrationEntries.length > 0) {
      const [key, value] = integrationEntries[0]
      items.push({
        title: `Connecting ${titleCase(key)}`,
        detail: `Using ${value} as the live context source for this worker.`,
        status: 'ready',
        icon: Mail,
      })
    }

    if (metadata.goal) {
      items.push({
        title: 'Prioritizing the main outcome',
        detail: metadata.goal,
        status: 'in_progress',
        icon: Briefcase,
      })
    }

    if (metadata.successMetric) {
      items.push({
        title: 'Tracking success',
        detail: `Success is being measured against: ${metadata.successMetric}`,
        status: 'queued',
        icon: Sparkles,
      })
    }

    if (dayOneTasks.length > 0) {
      dayOneTasks.slice(0, 2).forEach((task, index) => {
        items.push({
          title: index === 0 ? 'Starting first-hour task' : 'Lining up next task',
          detail: task,
          status: index === 0 ? 'in_progress' : 'queued',
          icon: PlayCircle,
        })
      })
    }

    if (metadata.mustDo) {
      items.push({
        title: 'Applying operating instructions',
        detail: metadata.mustDo,
        status: 'ready',
        icon: FileText,
      })
    }

    return items.slice(0, 5)
  }, [agent, bootTasks, dayOneTasks, metadata.goal, metadata.integrationDetails, metadata.mustDo, metadata.successMetric])

  async function handleDeleteAgent() {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      setError(null)

      const res = await authFetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete agent')
      }

      router.push('/agents')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete agent')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-coral-500 animate-spin" />
          <p className="text-gray-600">Loading worker...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Agent not found</h2>
        <p className="text-gray-600">The worker you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/agents" className="text-coral-500 hover:text-coral-600 font-medium">
          Back to agents
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-50 text-coral-700 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              {typeLabel} worker
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-gray-600 mt-2 max-w-3xl">{valueHeadline}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/create-agent"
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Create another
          </Link>
          <button
            onClick={handleDeleteAgent}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
              <div>
                <div className="text-sm font-semibold text-gray-900">What this worker is set up to do</div>
                <div className="text-sm text-gray-500 mt-1">
                  Visible value, based on the setup captured at deploy time.
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${agent.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                {agent.status}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <TopCard
                icon={Briefcase}
                label="Role"
                value={roleLabel}
                subtext={metadata.autonomyLevel ? titleCase(metadata.autonomyLevel) : 'Configured'}
              />
              <TopCard
                icon={Mail}
                label="Channels"
                value={channels.length > 0 ? channels.join(', ') : 'Not configured'}
                subtext={`${connectedTools.length} connected tool${connectedTools.length === 1 ? '' : 's'}`}
              />
              <TopCard
                icon={CalendarDays}
                label="Deployed"
                value={new Date(agent.deployed_at || agent.created_at).toLocaleDateString()}
                subtext={agent.business_name || 'Custom setup'}
              />
            </div>
          </div>

          {previewCards.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8">
              <SectionHeader
                title="Value Preview"
                description="These are the operating promises captured during setup."
              />
              <div className="grid gap-4 lg:grid-cols-3 mt-6">
                {previewCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <div className="text-sm font-semibold text-gray-900 mb-2">{card.title}</div>
                    <p className="text-sm text-gray-600 leading-6">{card.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {simulationExamples.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8">
              <SectionHeader
                title="What It Will Do In Practice"
                description="Concrete examples of how this worker should behave in real situations."
              />
              <div className="grid gap-4 lg:grid-cols-3 mt-6">
                {simulationExamples.map((example) => (
                  <div key={example.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-900 mb-2">{example.title}</div>
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Trigger</div>
                    <p className="text-sm text-gray-600 leading-6 mb-4">{example.trigger}</p>
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Expected action</div>
                    <p className="text-sm text-gray-700 leading-6">{example.outcome}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8">
            <SectionHeader
              title="Now Working"
              description="A live-feeling view of what this worker should be doing immediately after deploy."
            />
            <div className="space-y-3 mt-6">
              {nowWorkingItems.length > 0 ? (
                nowWorkingItems.map((item) => (
                  <ActivityRow
                    key={item.id || `${item.title}-${item.detail}`}
                    icon={item.icon}
                    title={item.title}
                    detail={item.detail}
                    status={item.status}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Add more context and integrations during setup to generate immediate work here.
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <InfoPanel
              title="Connected Context"
              description="What this worker can use to make better decisions."
              items={buildContextItems(agent, metadata)}
            />
            <InfoPanel
              title="Guardrails"
              description="The rules that make this safe and reliable."
              items={[
                metadata.mustDo || 'No primary instruction saved yet',
                metadata.mustAvoid || 'No strict avoid rule saved yet',
                metadata.approvalRules || 'No approval rules saved yet',
              ]}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-5">
            <SectionHeader
              title="Day-One Payoff"
              description="What the user should feel immediately after deploy."
            />

            {roiSummary ? (
              <div className="grid grid-cols-3 gap-3">
                <MetricCard label="Weekly" value={`${roiSummary.weeklyHours || '0'}h`} />
                <MetricCard label="Monthly" value={`${roiSummary.monthlyHours || '0'}h`} />
                <MetricCard label="Response" value={shortResponse(roiSummary.responseTime)} />
              </div>
            ) : null}

            <div className="space-y-3 text-sm text-gray-700">
              {roiSummary?.automationCoverage && (
                <SummaryLine icon={ShieldCheck} text={`Coverage: ${roiSummary.automationCoverage}`} />
              )}
              {metadata.successMetric && (
                <SummaryLine icon={Sparkles} text={`Success metric: ${metadata.successMetric}`} />
              )}
              <SummaryLine icon={Cpu} text={`Model behavior: ${agent.tone || 'professional'} tone`} />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6">
            <div className="text-sm font-semibold text-gray-900 mb-3">First hour after deploy</div>
            <div className="space-y-3">
              {dayOneTasks.length > 0 ? (
                dayOneTasks.map((task) => (
                  <div key={task} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{task}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600">
                  No first-hour actions were saved for this worker yet.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6">
            <div className="text-sm font-semibold text-gray-900 mb-4">Worker Snapshot</div>
            <div className="space-y-3 text-sm text-gray-700">
              <SummaryLine icon={Bot} text={`Type: ${typeLabel}`} />
              <SummaryLine icon={Briefcase} text={`Agent type: ${agent.agent_type}`} />
              <SummaryLine icon={MessageSquare} text={`Languages: ${metadata.languages || 'English'}`} />
              <SummaryLine icon={Mail} text={`Owner: ${metadata.owner?.email || metadata.owner?.name || 'Unknown'}`} />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 font-mono break-all">
              {agent.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function deriveChannels(agent: AgentRecord | null) {
  if (!agent) return []
  const channels: string[] = []
  if (agent.channels_email) channels.push('email')
  if (agent.channels_whatsapp) channels.push('whatsapp')
  if (agent.channels_phone) channels.push('phone')
  if (agent.channels_sms) channels.push('sms')
  return channels
}

function iconForBootTask(source: string): ElementType {
  if (source === 'integration') return Mail
  if (source === 'goal') return Briefcase
  if (source === 'metric') return Sparkles
  if (source === 'day_one_task') return PlayCircle
  if (source === 'instruction') return FileText
  return Bot
}

function buildContextItems(agent: AgentRecord, metadata: AgentMetadata) {
  const items: string[] = []

  if (agent.business_name || agent.business_industry) {
    items.push(
      `${agent.business_name || 'Business'}${agent.business_industry ? ` · ${agent.business_industry}` : ''}`
    )
  }

  if (metadata.websiteUrl) {
    items.push(`Website: ${metadata.websiteUrl}`)
  }

  const integrationEntries = Object.entries(metadata.integrationDetails || {}).filter(([, value]) =>
    Boolean(value?.trim())
  )
  integrationEntries.forEach(([key, value]) => {
    items.push(`${titleCase(key)}: ${value}`)
  })

  if (metadata.importantPeople) {
    items.push(metadata.importantPeople)
  }

  return items.length > 0 ? items : ['No connected context saved yet']
}

function shortResponse(value?: string) {
  if (!value) return 'N/A'
  if (value.includes('5 minutes')) return '<5m'
  if (value.includes('Same day') || value.includes('same-day')) return 'Same day'
  return value
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  )
}

function TopCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: ElementType
  label: string
  value: string
  subtext: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-coral-600 mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">{label}</div>
      <div className="text-base font-semibold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{subtext}</div>
    </div>
  )
}

function InfoPanel({ title, description, items }: { title: string; description: string; items: string[] }) {
  return (
    <section className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8">
      <SectionHeader title={title} description={description} />
      <div className="space-y-3 mt-6">
        {items.map((item) => (
          <div key={`${title}-${item}`} className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}

function SummaryLine({ icon: Icon, text }: { icon: ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-coral-600">
        <Icon className="w-4 h-4" />
      </div>
      <span>{text}</span>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-4 text-center">
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function ActivityRow({
  icon: Icon,
  title,
  detail,
  status,
}: {
  icon: ElementType
  title: string
  detail: string
  status: 'queued' | 'in_progress' | 'ready'
}) {
  const statusStyles = {
    queued: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-coral-50 text-coral-700',
    ready: 'bg-emerald-50 text-emerald-700',
  }

  const statusLabels = {
    queued: 'Queued',
    in_progress: 'In progress',
    ready: 'Ready',
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-coral-600 shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="font-medium text-gray-900">{title}</div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
        <div className="text-sm text-gray-600 mt-1 leading-6">{detail}</div>
      </div>
    </div>
  )
}
