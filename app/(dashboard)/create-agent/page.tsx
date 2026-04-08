'use client'

import type { ElementType, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Cpu,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { authFetch, useAuthSession } from '@/lib/auth/client'

type AgentKind = 'intern' | 'agent' | null

type StepId = 1 | 2 | 3 | 4 | 5

type Option = {
  id: string
  label: string
  description: string
}

type IntegrationBlueprint = {
  id: string
  label: string
  description: string
  placeholder: string
  helper: string
}

const PLAN_CONFIG = {
  intern: {
    label: 'Intern',
    price: '$25/mo',
    icon: GraduationCap,
    accent: 'emerald',
    promise: 'Great for drafting, research, reminders, and repeatable support work.',
    capabilities: ['Draft replies', 'Prepare briefings', 'Organize follow-ups', 'Ask before acting'],
  },
  agent: {
    label: 'Agent',
    price: '$50/mo',
    icon: Bot,
    accent: 'coral',
    promise: 'Best for owning outcomes with tools, approvals, and autonomous execution.',
    capabilities: ['Take action', 'Work across channels', 'Follow rules', 'Escalate when needed'],
  },
} as const

const ROLE_OPTIONS: Record<Exclude<AgentKind, null>, Option[]> = {
  intern: [
    {
      id: 'executive-assistant',
      label: 'Executive Assistant',
      description: 'Handles inbox triage, reminders, meeting prep, and daily briefs.',
    },
    {
      id: 'research-assistant',
      label: 'Research Assistant',
      description: 'Researches companies, summarizes findings, and prepares briefs.',
    },
    {
      id: 'support-assistant',
      label: 'Support Assistant',
      description: 'Drafts responses, tags issues, and keeps your team updated.',
    },
    {
      id: 'content-assistant',
      label: 'Content Assistant',
      description: 'Turns ideas into outlines, drafts, and reusable content assets.',
    },
  ],
  agent: [
    {
      id: 'lead-follow-up',
      label: 'Lead Follow-Up',
      description: 'Qualifies leads, sends follow-ups, and books meetings automatically.',
    },
    {
      id: 'customer-support',
      label: 'Customer Support',
      description: 'Handles inbound issues, resolves routine requests, and escalates edge cases.',
    },
    {
      id: 'appointment-booking',
      label: 'Appointment Booking',
      description: 'Books, confirms, and reschedules appointments across channels.',
    },
    {
      id: 'billing-reminder',
      label: 'Billing Reminder',
      description: 'Tracks unpaid invoices, nudges customers, and escalates overdue accounts.',
    },
  ],
}

const CHANNEL_OPTIONS: Option[] = [
  { id: 'email', label: 'Email', description: 'Inbound and outbound email work.' },
  { id: 'whatsapp', label: 'WhatsApp', description: 'Customer messaging and reminders.' },
  { id: 'sms', label: 'SMS', description: 'Short, time-sensitive nudges.' },
  { id: 'phone', label: 'Phone', description: 'Call scheduling and human handoff context.' },
]

const TONE_OPTIONS = ['Professional', 'Friendly', 'Direct', 'Warm']

const AUTONOMY_OPTIONS: Record<Exclude<AgentKind, null>, Option[]> = {
  intern: [
    {
      id: 'assistive',
      label: 'Assistive',
      description: 'Drafts and recommends actions, but you stay in control.',
    },
    {
      id: 'trusted-assistive',
      label: 'Trusted Assistive',
      description: 'Can organize work and prepare outputs without sending anything external.',
    },
  ],
  agent: [
    {
      id: 'approval-first',
      label: 'Approval First',
      description: 'Prepares actions and waits for approval before external execution.',
    },
    {
      id: 'guided-autonomy',
      label: 'Guided Autonomy',
      description: 'Acts on routine cases and escalates exceptions using your rules.',
    },
    {
      id: 'full-autonomy',
      label: 'Full Autonomy',
      description: 'Owns the workflow end-to-end within the limits you define.',
    },
  ],
}

const STEPS = ['Outcome', 'Context', 'Rules', 'Preview', 'Review']

const INPUT_CLASS =
  'w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-gray-900 outline-none transition focus:border-coral-400 focus:ring-4 focus:ring-coral-100'

const INTEGRATION_BLUEPRINTS: IntegrationBlueprint[] = [
  {
    id: 'gmail',
    label: 'Gmail',
    description: 'Use a real inbox for drafts, follow-ups, and triage.',
    placeholder: 'sales@yourbusiness.com',
    helper: 'Which inbox should this worker operate from?',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Book meetings and avoid conflicts using a live calendar.',
    placeholder: 'Founder calendar',
    helper: 'Which calendar should it reference?',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'Message leads and customers using your business number.',
    placeholder: '+91 98765 43210',
    helper: 'What business number should it work through?',
  },
  {
    id: 'crm',
    label: 'CRM',
    description: 'Update stages, notes, and customer records in one place.',
    placeholder: 'HubSpot - Sales pipeline',
    helper: 'Which CRM or pipeline should it update?',
  },
  {
    id: 'website',
    label: 'Website',
    description: 'Pull public context from your site and product pages.',
    placeholder: 'https://your-site.com',
    helper: 'What URL should it learn from?',
  },
  {
    id: 'docs',
    label: 'Docs & SOPs',
    description: 'Anchor decisions to internal policies, playbooks, and FAQs.',
    placeholder: 'Drive folder / SOP pack / Notion docs',
    helper: 'What docs or source of truth should it use?',
  },
]

function titleCase(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function estimateWeeklyHoursSaved(kind: Exclude<AgentKind, null>, connectedToolsCount: number) {
  const base = kind === 'agent' ? 6 : 3
  return base + connectedToolsCount * 1.5
}

export default function CreateAgentPage() {
  const router = useRouter()
  const { user } = useAuthSession()

  const [selectedKind, setSelectedKind] = useState<AgentKind>(null)
  const [step, setStep] = useState<StepId>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [agentName, setAgentName] = useState('')
  const [role, setRole] = useState('')
  const [goal, setGoal] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [knowledgeNotes, setKnowledgeNotes] = useState('')
  const [successMetric, setSuccessMetric] = useState('')
  const [importantPeople, setImportantPeople] = useState('')
  const [connectedTools, setConnectedTools] = useState<string[]>([])
  const [integrationDetails, setIntegrationDetails] = useState<Record<string, string>>({
    gmail: '',
    calendar: '',
    whatsapp: '',
    crm: '',
    website: '',
    docs: '',
  })
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [tone, setTone] = useState('Professional')
  const [languages, setLanguages] = useState('English')
  const [mustDo, setMustDo] = useState('')
  const [mustAvoid, setMustAvoid] = useState('')
  const [approvalRules, setApprovalRules] = useState('')
  const [autonomyLevel, setAutonomyLevel] = useState('')
  const [activeHoursStart, setActiveHoursStart] = useState('09')
  const [activeHoursEnd, setActiveHoursEnd] = useState('19')
  const [modelTier, setModelTier] = useState('balanced')

  const plan = selectedKind ? PLAN_CONFIG[selectedKind] : null
  const PlanIcon = plan?.icon
  const roleOptions = selectedKind ? ROLE_OPTIONS[selectedKind] : []
  const autonomyOptions = selectedKind ? AUTONOMY_OPTIONS[selectedKind] : []

  const reviewName = agentName.trim() || `${selectedKind === 'agent' ? 'Operator' : 'Assistant'} One`
  const reviewRole = role ? titleCase(role) : 'Custom Setup'
  const connectedIntegrationCount = connectedTools.filter((tool) => integrationDetails[tool]?.trim()).length

  function updateIntegrationDetail(toolId: string, value: string) {
    setIntegrationDetails((current) => ({
      ...current,
      [toolId]: value,
    }))
  }

  function toggleConnectedTool(toolId: string) {
    setConnectedTools((current) => toggleValue(current, toolId))
  }

  const previewCards = useMemo(() => {
    const persona = reviewName
    const business = businessName.trim() || 'your business'
    const outcome = goal.trim() || 'handle the work you assign'
    const instructions = mustDo.trim() || 'follow your operating rules and keep work moving'
    const guardrails = approvalRules.trim() || 'ask for approval when the situation is ambiguous'
    const tools = connectedTools.length > 0 ? connectedTools.join(', ') : 'connected tools'

    if (selectedKind === 'agent') {
      return [
        {
          title: 'What it will own',
          body: `${persona} will own ${outcome.toLowerCase()} for ${business}, using ${tools}.`,
        },
        {
          title: 'How it acts',
          body: `${persona} will take routine actions automatically, apply ${tone.toLowerCase()} communication, and follow this rule: ${instructions}.`,
        },
        {
          title: 'When it escalates',
          body: `${persona} will escalate when this applies: ${guardrails}. Success is measured by ${successMetric || 'faster response times and less manual work'}.`,
        },
      ]
    }

    return [
      {
        title: 'What it helps with',
        body: `${persona} will support ${outcome.toLowerCase()} for ${business} and prepare high-quality work before it reaches you.`,
      },
      {
        title: 'How it works',
        body: `${persona} will use ${tools} to draft, organize, and summarize work in a ${tone.toLowerCase()} tone. Core focus: ${instructions}.`,
      },
      {
        title: 'How you stay in control',
        body: `${persona} will not overstep this boundary: ${mustAvoid || 'avoid external commitments without approval'}. Approval rule: ${guardrails}.`,
      },
    ]
  }, [
    approvalRules,
    businessName,
    connectedTools,
    goal,
    mustAvoid,
    mustDo,
    reviewName,
    selectedKind,
    successMetric,
    tone,
  ])

  const simulationExamples = useMemo(() => {
    const worker = reviewName
    const business = businessName.trim() || 'your business'
    const toneStyle = tone.toLowerCase()
    const focus = goal.trim() || 'keep work moving'
    const approvals = approvalRules.trim() || 'ask before doing anything risky'
    const inbox = integrationDetails.gmail?.trim() || 'your inbox'
    const calendar = integrationDetails.calendar?.trim() || 'your calendar'
    const whatsappNumber = integrationDetails.whatsapp?.trim() || 'your business WhatsApp'

    if (selectedKind === 'agent') {
      return [
        {
          title: 'Lead follow-up simulation',
          trigger: 'A new inbound lead asks for pricing and next steps.',
          outcome: `${worker} replies from ${inbox} in a ${toneStyle} tone, shares the approved next step, updates the CRM, and offers a slot from ${calendar}.`,
        },
        {
          title: 'Escalation simulation',
          trigger: 'A customer asks for a custom discount outside policy.',
          outcome: `${worker} pauses autonomous action, summarizes the request, and escalates because your approval rule says: ${approvals}.`,
        },
        {
          title: 'Execution simulation',
          trigger: `A warm lead stops replying for 24 hours.` ,
          outcome: `${worker} sends a follow-up through ${whatsappNumber}, logs the touchpoint, and keeps ${business} moving toward ${focus.toLowerCase()}.`,
        },
      ]
    }

    return [
      {
        title: 'Inbox draft simulation',
        trigger: 'An important email arrives from a customer or stakeholder.',
        outcome: `${worker} drafts a clear response in ${inbox}, tags urgency, and highlights anything that needs your attention.`,
      },
      {
        title: 'Meeting prep simulation',
        trigger: 'You have a meeting in 30 minutes.',
        outcome: `${worker} prepares a concise briefing from ${business}, your notes, and ${calendar}.`,
      },
      {
        title: 'Boundary simulation',
        trigger: 'A sender asks the assistant to confirm a policy change.',
        outcome: `${worker} does not overstep. It summarizes the request and asks because your rule says: ${approvals}.`,
      },
    ]
  }, [approvalRules, businessName, goal, integrationDetails, reviewName, selectedKind, tone])

  const roiSummary = useMemo(() => {
    if (!selectedKind) return null

    const weeklyHours = estimateWeeklyHoursSaved(selectedKind, connectedIntegrationCount)
    const responseTime = selectedKind === 'agent' ? 'under 5 minutes on routine work' : 'same-day drafts and prep'
    const automationCoverage = selectedKind === 'agent' ? `${Math.min(85, 40 + connectedIntegrationCount * 10)}% of routine cases` : `${Math.min(75, 30 + connectedIntegrationCount * 10)}% of prep and drafting work`

    return {
      weeklyHours: weeklyHours.toFixed(1),
      monthlyHours: (weeklyHours * 4.3).toFixed(0),
      responseTime,
      automationCoverage,
    }
  }, [connectedIntegrationCount, selectedKind])

  const dayOneTasks = useMemo(() => {
    const tasks = []

    if (integrationDetails.gmail?.trim()) {
      tasks.push(`Watch ${integrationDetails.gmail.trim()} and prepare the first set of drafts.`)
    }
    if (integrationDetails.calendar?.trim()) {
      tasks.push(`Read ${integrationDetails.calendar.trim()} and build today's briefing.`)
    }
    if (websiteUrl.trim()) {
      tasks.push(`Pull public business context from ${websiteUrl.trim()}.`)
    }
    if (knowledgeNotes.trim()) {
      tasks.push('Turn your SOPs and notes into an internal context pack.')
    }
    if (selectedKind === 'agent') {
      tasks.push('Start handling the first routine cases using your approval rules.')
    }

    return tasks.slice(0, 4)
  }, [integrationDetails, knowledgeNotes, selectedKind, websiteUrl])

  const compiledKnowledge = useMemo(() => {
    const sections = [
      businessName ? `Business: ${businessName}` : '',
      industry ? `Industry: ${industry}` : '',
      websiteUrl ? `Website: ${websiteUrl}` : '',
      connectedTools.length > 0
        ? `Connected integrations:\n${connectedTools
            .map((toolId) => {
              const blueprint = INTEGRATION_BLUEPRINTS.find((item) => item.id === toolId)
              const detail = integrationDetails[toolId]?.trim()
              return `${blueprint?.label || titleCase(toolId)}: ${detail || 'selected'}`
            })
            .join('\n')}`
        : '',
      knowledgeNotes ? `Business context and SOPs:\n${knowledgeNotes}` : '',
      importantPeople ? `Important people and stakeholders:\n${importantPeople}` : '',
      successMetric ? `Success metric: ${successMetric}` : '',
    ]

    return sections.filter(Boolean).join('\n\n')
  }, [
    businessName,
    connectedTools,
    importantPeople,
    industry,
    integrationDetails,
    knowledgeNotes,
    successMetric,
    websiteUrl,
  ])

  const canContinue = useMemo(() => {
    if (!selectedKind) return false

    switch (step) {
      case 1:
        return Boolean(agentName.trim() && role && goal.trim())
      case 2:
        return Boolean(businessName.trim() && (knowledgeNotes.trim() || connectedIntegrationCount > 0))
      case 3:
        return Boolean(mustDo.trim() && mustAvoid.trim() && approvalRules.trim() && autonomyLevel)
      case 4:
      case 5:
        return true
      default:
        return false
    }
  }, [
    agentName,
    approvalRules,
    autonomyLevel,
    businessName,
    connectedIntegrationCount,
    goal,
    knowledgeNotes,
    mustAvoid,
    mustDo,
    role,
    selectedKind,
    step,
  ])

  function applyKind(kind: Exclude<AgentKind, null>) {
    const defaultRole = ROLE_OPTIONS[kind][0]?.id ?? ''
    setSelectedKind(kind)
    setStep(1)
    setRole(defaultRole)
    setError(null)
    setSelectedChannels(kind === 'agent' ? ['email', 'whatsapp'] : ['email'])
    setConnectedTools(kind === 'agent' ? ['gmail', 'calendar', 'docs'] : ['gmail', 'calendar'])
    setIntegrationDetails((current) => ({
      ...current,
      gmail: current.gmail || user?.email || '',
      calendar: current.calendar || 'Primary calendar',
      whatsapp: current.whatsapp || '',
      crm: current.crm || '',
      website: current.website || websiteUrl || '',
      docs: current.docs || 'Main SOP pack',
    }))
    setAutonomyLevel(kind === 'agent' ? 'guided-autonomy' : 'assistive')
    setModelTier(kind === 'agent' ? 'smart' : 'balanced')
    if (!agentName.trim()) {
      setAgentName(kind === 'agent' ? 'Revenue Operator' : 'Inbox Assistant')
    }
    if (!goal.trim()) {
      setGoal(
        kind === 'agent'
          ? 'Respond to inbound leads, follow up automatically, and book qualified meetings.'
          : 'Keep my inbox organized, prepare draft replies, and build daily briefs.'
      )
    }
    if (!mustDo.trim()) {
      setMustDo(
        kind === 'agent'
          ? 'Act quickly on routine cases, log what happened, and keep the workflow moving.'
          : 'Prepare useful drafts, clear summaries, and reminders before I need them.'
      )
    }
    if (!mustAvoid.trim()) {
      setMustAvoid(
        kind === 'agent'
          ? 'Never promise discounts, refunds, or custom terms without approval.'
          : 'Never send external messages or commit to decisions on my behalf.'
      )
    }
    if (!approvalRules.trim()) {
      setApprovalRules(
        kind === 'agent'
          ? 'Ask before pricing changes, refunds, sensitive customer issues, or any exception to policy.'
          : 'Ask before sending anything externally, scheduling changes, or escalating a conversation.'
      )
    }
  }

  async function handleSubmit() {
    if (!selectedKind) return

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch('/api/agents', {
        method: 'POST',
        body: JSON.stringify({
          type: selectedKind,
          name: reviewName,
          role,
          goal,
          businessName,
          industry,
          websiteUrl,
          ownerName: user?.name || '',
          ownerEmail: user?.email || '',
          connectedTools,
          integrationDetails,
          channels: selectedChannels,
          tone: tone.toLowerCase(),
          languages,
          mustDo,
          mustAvoid,
          approvalRules,
          autonomyLevel,
          successMetric,
          importantPeople,
          activeHours: { start: activeHoursStart, end: activeHoursEnd },
          modelTier,
          previewCards,
          simulationExamples,
          roiSummary,
          dayOneTasks,
          knowledgeBase: {
            method: websiteUrl ? 'hybrid' : 'manual',
            url: websiteUrl,
            content: compiledKnowledge,
          },
        }),
      })

      const data = (await response.json()) as { id?: string; error?: string }

      if (!response.ok || !data.id) {
        throw new Error(data.error || 'Failed to create agent')
      }

      router.push(`/agents/${data.id}?success=true`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create agent')
      setLoading(false)
      return
    }

    setLoading(false)
  }

  const currentStepLabel = STEPS[step - 1]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-50 text-coral-700 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Build a worker, not a chatbot
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an AI employee users can feel</h1>
          <p className="text-gray-600 max-w-3xl">
            Start with the job to be done, connect the right context, define guardrails, and
            preview how the worker will operate before deployment.
          </p>
        </div>

        {plan && (
          <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 min-w-[220px]">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Selected plan
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.accent === 'coral' ? 'bg-coral-50 text-coral-600' : 'bg-emerald-50 text-emerald-600'}`}
              >
                {PlanIcon ? <PlanIcon className="w-5 h-5" /> : null}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{plan.label}</div>
                <div className="text-sm text-gray-500">{plan.price}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {(['intern', 'agent'] as const).map((kind) => {
              const config = PLAN_CONFIG[kind]
              const ConfigIcon = config.icon
              const selected = selectedKind === kind

              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => applyKind(kind)}
                  className={`rounded-2xl border p-6 text-left transition-all ${
                    selected
                      ? kind === 'agent'
                        ? 'border-coral-300 bg-coral-50 shadow-sm'
                        : 'border-emerald-300 bg-emerald-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        kind === 'agent' ? 'bg-coral-100 text-coral-600' : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      <ConfigIcon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{config.price}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{config.label}</h2>
                  <p className="text-sm text-gray-600 mb-4">{config.promise}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {config.capabilities.map((capability) => (
                      <div key={capability} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {capability}
                      </div>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          {selectedKind && (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-8">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {STEPS.map((label, index) => {
                  const stepNumber = (index + 1) as StepId
                  const active = step === stepNumber
                  const completed = step > stepNumber

                  return (
                    <div key={label} className="flex items-center gap-2 min-w-fit">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          active || completed
                            ? 'bg-coral-500 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {stepNumber}
                      </div>
                      <span className={`text-sm ${active ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                        {label}
                      </span>
                      {index < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
                    </div>
                  )
                })}
              </div>

              {step === 1 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Start with the job to be done"
                    description="Make the value obvious: define what this worker should own every day."
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    {roleOptions.map((option) => {
                      const selected = role === option.id

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setRole(option.id)}
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            selected
                              ? 'border-coral-300 bg-coral-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold text-gray-900 mb-1">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Worker name">
                      <input
                        value={agentName}
                        onChange={(event) => setAgentName(event.target.value)}
                        placeholder={selectedKind === 'agent' ? 'e.g. Revenue Operator' : 'e.g. Inbox Assistant'}
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Languages">
                      <input
                        value={languages}
                        onChange={(event) => setLanguages(event.target.value)}
                        placeholder="e.g. English, Hindi"
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>

                  <Field
                    label={selectedKind === 'agent' ? 'What exact outcome should it own?' : 'What should it help you with day to day?'}
                  >
                    <textarea
                      value={goal}
                      onChange={(event) => setGoal(event.target.value)}
                      rows={5}
                      placeholder={
                        selectedKind === 'agent'
                          ? 'Example: respond to inbound leads within 5 minutes, qualify them, and book meetings for good-fit buyers.'
                          : 'Example: keep my inbox organized, draft replies, prepare meeting briefs, and remind me before deadlines.'
                      }
                      className={`${INPUT_CLASS} min-h-[132px]`}
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Connect context"
                    description="This is where the worker stops feeling generic and starts feeling like it knows your business."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Business or team name">
                      <input
                        value={businessName}
                        onChange={(event) => setBusinessName(event.target.value)}
                        placeholder="e.g. Diyaa AI"
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Industry">
                      <input
                        value={industry}
                        onChange={(event) => setIndustry(event.target.value)}
                        placeholder="e.g. AI automation agency"
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Website">
                      <input
                        value={websiteUrl}
                        onChange={(event) => setWebsiteUrl(event.target.value)}
                        placeholder="https://your-site.com"
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Success metric">
                      <input
                        value={successMetric}
                        onChange={(event) => setSuccessMetric(event.target.value)}
                        placeholder="e.g. 2 hrs saved/week or reply within 5 minutes"
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Connect tools</div>
                        <div className="text-sm text-gray-500">
                          Add real account details so the worker feels operational, not theoretical.
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {connectedIntegrationCount} fully configured integration{connectedIntegrationCount === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {INTEGRATION_BLUEPRINTS.map((tool) => {
                        const selected = connectedTools.includes(tool.id)

                        return (
                          <div
                            key={tool.id}
                            className={`rounded-2xl border p-4 transition-colors ${
                              selected ? 'border-coral-300 bg-coral-50' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <div className="font-medium text-gray-900">{tool.label}</div>
                                <div className="text-sm text-gray-600">{tool.description}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleConnectedTool(tool.id)}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                                  selected
                                    ? 'bg-coral-500 text-white hover:bg-coral-600'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {selected ? 'Connected' : 'Enable'}
                              </button>
                            </div>

                            <label className="block">
                              <span className="text-xs font-medium text-gray-500">{tool.helper}</span>
                              <input
                                value={integrationDetails[tool.id] || ''}
                                onChange={(event) => updateIntegrationDetail(tool.id, event.target.value)}
                                placeholder={tool.placeholder}
                                className={`${INPUT_CLASS} mt-2`}
                              />
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-3">Channels it should work across</div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {CHANNEL_OPTIONS.map((channel) => {
                        const selected = selectedChannels.includes(channel.id)

                        return (
                          <SelectableCard
                            key={channel.id}
                            title={channel.label}
                            description={channel.description}
                            selected={selected}
                            onClick={() => setSelectedChannels((current) => toggleValue(current, channel.id))}
                          />
                        )
                      })}
                    </div>
                  </div>

                  <Field label="Important context, SOPs, FAQ answers, pricing, or business notes">
                    <textarea
                      value={knowledgeNotes}
                      onChange={(event) => setKnowledgeNotes(event.target.value)}
                      rows={6}
                      placeholder="Paste the operating context you want this worker to use. Good input here has the biggest impact on quality."
                      className={`${INPUT_CLASS} min-h-[160px]`}
                    />
                  </Field>

                  <Field label="Important people, customers, or stakeholders">
                    <textarea
                      value={importantPeople}
                      onChange={(event) => setImportantPeople(event.target.value)}
                      rows={4}
                      placeholder="Example: Founder: Udaya. VIP clients: Acme, Nova Labs. Finance approvals: Priya."
                      className={`${INPUT_CLASS} min-h-[120px]`}
                    />
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Set guardrails and decision rules"
                    description="Trust comes from clear boundaries. Decide what it should do, what it should avoid, and when it should ask you first."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Communication tone">
                      <div className="grid grid-cols-2 gap-2">
                        {TONE_OPTIONS.map((toneOption) => (
                          <button
                            key={toneOption}
                            type="button"
                            onClick={() => setTone(toneOption)}
                            className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                              tone === toneOption
                                ? 'border-coral-300 bg-coral-50 text-coral-700'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {toneOption}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field label="Autonomy level">
                      <div className="space-y-2">
                        {autonomyOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setAutonomyLevel(option.id)}
                            className={`w-full rounded-xl border p-3 text-left transition-colors ${
                              autonomyLevel === option.id
                                ? 'border-coral-300 bg-coral-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-medium text-gray-900">{option.label}</div>
                            <div className="text-sm text-gray-600">{option.description}</div>
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Working hours start">
                      <input
                        value={activeHoursStart}
                        onChange={(event) => setActiveHoursStart(event.target.value)}
                        type="number"
                        min="0"
                        max="23"
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Working hours end">
                      <input
                        value={activeHoursEnd}
                        onChange={(event) => setActiveHoursEnd(event.target.value)}
                        type="number"
                        min="0"
                        max="23"
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>

                  <Field label="What it must do well">
                    <textarea
                      value={mustDo}
                      onChange={(event) => setMustDo(event.target.value)}
                      rows={4}
                      placeholder="Example: respond fast, log every action, summarize key changes, keep tone calm and concise."
                      className={`${INPUT_CLASS} min-h-[120px]`}
                    />
                  </Field>

                  <Field label="What it must never do">
                    <textarea
                      value={mustAvoid}
                      onChange={(event) => setMustAvoid(event.target.value)}
                      rows={4}
                      placeholder="Example: never promise discounts, never expose internal information, never approve a refund without sign-off."
                      className={`${INPUT_CLASS} min-h-[120px]`}
                    />
                  </Field>

                  <Field label="Approval and escalation rules">
                    <textarea
                      value={approvalRules}
                      onChange={(event) => setApprovalRules(event.target.value)}
                      rows={4}
                      placeholder="Example: ask me before pricing changes, escalations from angry customers, or anything outside standard policy."
                      className={`${INPUT_CLASS} min-h-[120px]`}
                    />
                  </Field>

                  <Field label="Reasoning model">
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        {
                          id: 'fast',
                          title: 'Fast',
                          description: 'Cheaper and quicker for routine tasks.',
                        },
                        {
                          id: 'balanced',
                          title: 'Balanced',
                          description: 'Good default for most business workflows.',
                        },
                        {
                          id: 'smart',
                          title: 'Smart',
                          description: 'Best for nuanced logic and edge cases.',
                        },
                      ].map((option) => (
                        <SelectableCard
                          key={option.id}
                          title={option.title}
                          description={option.description}
                          selected={modelTier === option.id}
                          onClick={() => setModelTier(option.id)}
                        />
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Preview the value"
                    description="Before deploy, show exactly how this worker will operate. This is where the setup stops feeling abstract."
                  />

                  <div className="grid gap-4 lg:grid-cols-3">
                    {previewCards.map((card) => (
                      <div key={card.title} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                        <div className="text-sm font-semibold text-gray-900 mb-2">{card.title}</div>
                        <p className="text-sm text-gray-600 leading-6">{card.body}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-coral-100 bg-coral-50 p-5">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-coral-600 mt-0.5" />
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">What makes this worth paying for</div>
                        <p className="text-sm text-gray-700 leading-6">
                          {selectedKind === 'agent'
                            ? `${reviewName} is set up to own ${goal.toLowerCase()} with ${connectedTools.length || 0} connected context source${connectedTools.length === 1 ? '' : 's'}, ${selectedChannels.length || 0} working channel${selectedChannels.length === 1 ? '' : 's'}, and clear escalation rules.`
                            : `${reviewName} is set up to save time on ${goal.toLowerCase()} with your business context, quality instructions, and approval-first boundaries.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    {simulationExamples.map((example) => (
                      <div key={example.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="text-sm font-semibold text-gray-900 mb-2">{example.title}</div>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">
                          Trigger
                        </div>
                        <p className="text-sm text-gray-600 leading-6 mb-4">{example.trigger}</p>
                        <div className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">
                          What happens
                        </div>
                        <p className="text-sm text-gray-700 leading-6">{example.outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Review before deploy"
                    description="Review the operational setup, not just the profile."
                  />

                  <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-2xl border border-gray-200 p-6 space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-coral-50 text-coral-600 flex items-center justify-center">
                          {selectedKind === 'agent' ? <Bot className="w-7 h-7" /> : <GraduationCap className="w-7 h-7" />}
                        </div>
                        <div>
                          <div className="text-xl font-semibold text-gray-900">{reviewName}</div>
                          <div className="text-sm text-gray-500">
                            {plan?.label} · {reviewRole}
                          </div>
                        </div>
                      </div>

                      <ReviewBlock title="What it will handle" items={[goal]} />
                      <ReviewBlock
                        title="What it knows"
                        items={[
                          businessName ? `${businessName}${industry ? ` · ${industry}` : ''}` : 'Business context',
                          websiteUrl || 'No website connected yet',
                          knowledgeNotes || 'No additional SOP or FAQ notes added yet',
                        ]}
                      />
                      <ReviewBlock
                        title="Connected stack"
                        items={[
                          connectedTools.length > 0 ? connectedTools.join(', ') : 'No tools selected',
                          connectedIntegrationCount > 0
                            ? `${connectedIntegrationCount} integrations have account details added`
                            : 'No live account details added yet',
                          selectedChannels.length > 0 ? `Channels: ${selectedChannels.join(', ')}` : 'No channels selected',
                          `Model: ${titleCase(modelTier)}`,
                        ]}
                      />
                      <ReviewBlock title="Guardrails" items={[mustDo, mustAvoid, approvalRules]} />
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-5">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Value summary</div>
                        <p className="text-sm text-gray-600 mt-1">
                          This setup is designed to make the worker useful on day one.
                        </p>
                      </div>

                      <div className="space-y-3 text-sm text-gray-700">
                        <SummaryLine icon={Briefcase} text={`Owns: ${reviewRole}`} />
                        <SummaryLine
                          icon={Cpu}
                          text={`Works in ${tone.toLowerCase()} tone with ${titleCase(autonomyLevel)}`}
                        />
                        <SummaryLine
                          icon={Mail}
                          text={`Channels ready: ${selectedChannels.length > 0 ? selectedChannels.join(', ') : 'none yet'}`}
                        />
                        <SummaryLine
                          icon={CalendarDays}
                          text={`Working window: ${activeHoursStart}:00 to ${activeHoursEnd}:00`}
                        />
                        {roiSummary && (
                          <>
                            <SummaryLine icon={Sparkles} text={`Estimated time saved: ${roiSummary.weeklyHours} hrs/week`} />
                            <SummaryLine icon={ShieldCheck} text={`Covers: ${roiSummary.automationCoverage}`} />
                          </>
                        )}
                      </div>

                      {roiSummary && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-5">
                          <div className="text-sm font-semibold text-gray-900 mb-3">ROI snapshot</div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <MetricCard label="Weekly" value={`${roiSummary.weeklyHours}h`} />
                            <MetricCard label="Monthly" value={`${roiSummary.monthlyHours}h`} />
                            <MetricCard label="Response" value={roiSummary.responseTime} />
                          </div>
                        </div>
                      )}

                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="text-sm font-semibold text-gray-900 mb-3">First hour after deploy</div>
                        <div className="space-y-2">
                          {dayOneTasks.length > 0 ? (
                            dayOneTasks.map((task) => (
                              <div key={task} className="text-sm text-gray-700 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                <span>{task}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-600">
                              Add integrations or more context to unlock immediate post-deploy work.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-coral-200 bg-white p-5 text-center">
                        <div className="text-3xl font-bold text-gray-900">{plan?.price}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {selectedKind === 'agent'
                            ? 'Configured to execute work with tools, approvals, and escalation rules.'
                            : 'Configured to save time immediately with context, drafts, and structured support.'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`w-full rounded-2xl px-5 py-4 text-sm font-semibold text-white transition-colors ${
                          loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-coral-500 hover:bg-coral-600'
                        }`}
                      >
                        {loading ? 'Deploying...' : `Deploy ${plan?.label}`}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep((current) => (Math.max(1, current - 1) as StepId))}
                  disabled={step === 1}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                {step < 5 && (
                  <button
                    type="button"
                    onClick={() => setStep((current) => (Math.min(5, current + 1) as StepId))}
                    disabled={!canContinue}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
                      canContinue ? 'bg-coral-500 hover:bg-coral-600' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Continue to {STEPS[step]}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-400">Current step: {currentStepLabel}</div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 sticky top-6">
            <div className="text-sm font-semibold text-gray-900">What a 10/10 setup needs</div>
            <div className="space-y-3">
              <ChecklistItem icon={Briefcase} title="Clear outcome" text="Start with the job to be done, not cosmetic setup." />
              <ChecklistItem icon={Globe} title="Real context" text="Connect tools, docs, website content, and business rules." />
              <ChecklistItem icon={ShieldCheck} title="Guardrails" text="Define what it can do, what it must avoid, and when it should escalate." />
              <ChecklistItem icon={FileText} title="Concrete preview" text="Show the user exactly how this worker will operate before deploy." />
            </div>
          </div>

          <div className="bg-gray-900 text-white rounded-3xl p-6 space-y-4">
            <div className="text-sm font-semibold text-coral-300">Owner context</div>
            <div className="space-y-2 text-sm text-gray-300">
              <div>{user?.name || 'Signed-in user'}</div>
              <div>{user?.email || 'No email found'}</div>
            </div>
            <p className="text-sm text-gray-400 leading-6">
              Use this setup to show customers why this worker deserves its monthly price before
              they ever hit deploy.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 max-w-3xl">{description}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-gray-900">{label}</span>
      {children}
    </label>
  )
}

function SelectableCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-colors ${
        selected ? 'border-coral-300 bg-coral-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="font-medium text-gray-900 mb-1">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </button>
  )
}

function ReviewBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-sm font-semibold text-gray-900 mb-2">{title}</div>
      <div className="space-y-2">
        {items.filter(Boolean).map((item) => (
          <div key={`${title}-${item}`} className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function ChecklistItem({
  icon: Icon,
  title,
  text,
}: {
  icon: ElementType
  title: string
  text: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-coral-600">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{text}</div>
      </div>
    </div>
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
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-4">
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
