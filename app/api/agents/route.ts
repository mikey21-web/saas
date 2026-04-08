import { NextRequest, NextResponse } from 'next/server'
import { resolveAuthIdentity } from '@/lib/auth/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export const runtime = 'nodejs'

type CreateAgentBody = {
  type?: 'intern' | 'agent'
  name?: string
  role?: string
  goal?: string
  businessName?: string
  industry?: string
  products?: string
  websiteUrl?: string
  ownerName?: string
  ownerEmail?: string
  knowledgeBase?: {
    method?: string
    url?: string
    content?: string
  }
  tone?: string
  activeHours?: {
    start?: string
    end?: string
  }
  channels?: string[]
  modelTier?: string
  connectedTools?: string[]
  integrationDetails?: Record<string, string>
  languages?: string
  mustDo?: string
  mustAvoid?: string
  approvalRules?: string
  autonomyLevel?: string
  successMetric?: string
  importantPeople?: string
  previewCards?: Array<{ title: string; body: string }>
  simulationExamples?: Array<{ title: string; trigger: string; outcome: string }>
  roiSummary?: {
    weeklyHours?: string
    monthlyHours?: string
    responseTime?: string
    automationCoverage?: string
  } | null
  dayOneTasks?: string[]
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toList(values?: string[]) {
  return Array.isArray(values)
    ? values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : []
}

function buildBootTasks(body: CreateAgentBody) {
  const tasks: Array<{
    title: string
    detail: string
    status: 'queued' | 'in_progress' | 'ready'
    source: string
  }> = []

  const integrationEntries = Object.entries(body.integrationDetails || {}).filter(([, value]) =>
    Boolean(value?.trim())
  )

  if (integrationEntries.length > 0) {
    const [tool, value] = integrationEntries[0]
    tasks.push({
      title: `Connecting ${tool}`,
      detail: `Using ${value} as the live context source for this worker.`,
      status: 'ready',
      source: 'integration',
    })
  }

  if (body.goal?.trim()) {
    tasks.push({
      title: 'Prioritizing the main outcome',
      detail: body.goal.trim(),
      status: 'in_progress',
      source: 'goal',
    })
  }

  if (body.successMetric?.trim()) {
    tasks.push({
      title: 'Tracking success',
      detail: `Success is being measured against: ${body.successMetric.trim()}`,
      status: 'queued',
      source: 'metric',
    })
  }

  if (Array.isArray(body.dayOneTasks)) {
    body.dayOneTasks.slice(0, 2).forEach((task, index) => {
      if (!task?.trim()) return
      tasks.push({
        title: index === 0 ? 'Starting first-hour task' : 'Lining up next task',
        detail: task.trim(),
        status: index === 0 ? 'in_progress' : 'queued',
        source: 'day_one_task',
      })
    })
  }

  if (body.mustDo?.trim()) {
    tasks.push({
      title: 'Applying operating instructions',
      detail: body.mustDo.trim(),
      status: 'ready',
      source: 'instruction',
    })
  }

  return tasks.slice(0, 5)
}

function buildSystemPrompt(input: {
  agentName: string
  type: 'intern' | 'agent'
  role: string
  goal: string
  businessName: string
  industry: string
  tone: string
  languages: string
  connectedTools: string[]
  channels: string[]
  mustDo: string
  mustAvoid: string
  approvalRules: string
  autonomyLevel: string
  successMetric: string
  websiteUrl: string
  knowledgeContent: string
}) {
  const toolList = input.connectedTools.length > 0 ? input.connectedTools.join(', ') : 'no tools yet'
  const channelList = input.channels.length > 0 ? input.channels.join(', ') : 'no channels yet'

  return [
    `You are ${input.agentName}, a ${input.type} for ${input.businessName}.`,
    `Primary role: ${input.role}.`,
    `Primary goal: ${input.goal}.`,
    `Industry: ${input.industry || 'general business'}.`,
    `Communication tone: ${input.tone}. Languages: ${input.languages || 'English'}.`,
    `Connected tools: ${toolList}. Active channels: ${channelList}.`,
    `Autonomy level: ${input.autonomyLevel || 'approval-first'}.`,
    `Must do: ${input.mustDo || 'Be accurate, useful, and action-oriented.'}`,
    `Must never do: ${input.mustAvoid || 'Do not make commitments or take risky actions without approval.'}`,
    `Approval and escalation rules: ${input.approvalRules || 'Escalate anything ambiguous, risky, or outside policy.'}`,
    `Success metric: ${input.successMetric || 'Save time while maintaining quality and trust.'}`,
    input.websiteUrl ? `Business website: ${input.websiteUrl}.` : '',
    input.knowledgeContent ? `Business knowledge:\n${input.knowledgeContent}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export async function POST(req: NextRequest) {
  try {
    const identity = await resolveAuthIdentity(req)
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as CreateAgentBody
    const supabase = supabaseAdmin
    const supabaseUserId = identity.supabaseUserId

    const type = body.type === 'intern' ? 'intern' : 'agent'
    const role = body.role?.trim() || (type === 'intern' ? 'executive-assistant' : 'custom-agent')
    const businessName = body.businessName?.trim() || 'My Business'
    const industry = body.industry?.trim() || 'General'
    const goal = body.goal?.trim() || 'Handle business operations effectively.'
    const agentName = body.name?.trim() || `${businessName} ${type === 'intern' ? 'Assistant' : 'Agent'}`
    const tone = body.tone?.trim() || 'professional'
    const languages = body.languages?.trim() || 'English'
    const connectedTools = toList(body.connectedTools)
    const channels = toList(body.channels)
    const activeHoursStart = Number.parseInt(body.activeHours?.start || '9', 10)
    const activeHoursEnd = Number.parseInt(body.activeHours?.end || '19', 10)
    const knowledgeContent = body.knowledgeBase?.content?.trim() || ''
    const bootTasks = buildBootTasks(body)

    const systemPrompt = buildSystemPrompt({
      agentName,
      type,
      role,
      goal,
      businessName,
      industry,
      tone,
      languages,
      connectedTools,
      channels,
      mustDo: body.mustDo?.trim() || '',
      mustAvoid: body.mustAvoid?.trim() || '',
      approvalRules: body.approvalRules?.trim() || '',
      autonomyLevel: body.autonomyLevel?.trim() || '',
      successMetric: body.successMetric?.trim() || '',
      websiteUrl: body.websiteUrl?.trim() || body.knowledgeBase?.url?.trim() || '',
      knowledgeContent,
    })

    const agentData = {
      user_id: supabaseUserId,
      name: agentName,
      template_id: type === 'intern' ? 'intern-worker' : 'custom-worker',
      agent_type: slugify(role) || type,
      status: 'active',
      description: goal,
      system_prompt: systemPrompt,
      business_name: businessName,
      business_industry: industry,
      business_description: body.products?.trim() || goal,
      tone,
      channels_whatsapp: channels.includes('whatsapp'),
      channels_email: channels.includes('email'),
      channels_sms: channels.includes('sms'),
      channels_phone: channels.includes('phone'),
      ai_model: type === 'agent' ? 'groq' : 'gemini',
      ai_model_tier:
        body.modelTier === 'fast' || body.modelTier === 'smart' ? body.modelTier : 'balanced',
      active_hours_start: Number.isNaN(activeHoursStart) ? 9 : activeHoursStart,
      active_hours_end: Number.isNaN(activeHoursEnd) ? 19 : activeHoursEnd,
      active_hours_timezone: 'Asia/Kolkata',
      metadata: {
        setup_version: 'value-first-v1',
        type,
        role,
        goal,
        websiteUrl: body.websiteUrl?.trim() || body.knowledgeBase?.url?.trim() || '',
        owner: {
          name: body.ownerName?.trim() || '',
          email: body.ownerEmail?.trim() || '',
        },
        connectedTools,
        integrationDetails: body.integrationDetails || {},
        channels,
        languages,
        mustDo: body.mustDo?.trim() || '',
        mustAvoid: body.mustAvoid?.trim() || '',
        approvalRules: body.approvalRules?.trim() || '',
        autonomyLevel: body.autonomyLevel?.trim() || '',
        successMetric: body.successMetric?.trim() || '',
        importantPeople: body.importantPeople?.trim() || '',
        previewCards: body.previewCards || [],
        simulationExamples: body.simulationExamples || [],
        roiSummary: body.roiSummary || null,
        dayOneTasks: Array.isArray(body.dayOneTasks) ? body.dayOneTasks : [],
      },
      deployed_at: new Date().toISOString(),
    }

    const { data: agent, error } = await (supabase.from('agents') as any)
      .insert(agentData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const rollbackAgent = async () => {
      await (supabase.from('agents') as any).delete().eq('id', agent.id).eq('user_id', supabaseUserId)
    }

    if (knowledgeContent) {
      const { error: knowledgeError } = await (supabase.from('knowledge_documents') as any).insert({
        agent_id: agent.id,
        user_id: supabaseUserId,
        title: `${agentName} Context Pack`,
        content: knowledgeContent,
        source: body.knowledgeBase?.method || 'manual',
      })

      if (knowledgeError) {
        await rollbackAgent()
        return NextResponse.json({ success: false, error: knowledgeError.message }, { status: 500 })
      }
    }

    const { error: deployLogError } = await (supabase.from('activity_logs') as any).insert({
      user_id: supabaseUserId,
      agent_id: agent.id,
      action: 'agent_deployed',
      details: JSON.stringify({
        type,
        role,
        configuredVia: 'value_first_create_flow',
      }),
    })

    if (deployLogError) {
      await rollbackAgent()
      return NextResponse.json({ success: false, error: deployLogError.message }, { status: 500 })
    }

    if (bootTasks.length > 0) {
      const { error: bootTaskError } = await (supabase.from('activity_logs') as any).insert(
        bootTasks.map((task) => ({
          user_id: supabaseUserId,
          agent_id: agent.id,
          action: 'boot_task_seeded',
          details: JSON.stringify(task),
        }))
      )

      if (bootTaskError) {
        await rollbackAgent()
        return NextResponse.json({ success: false, error: bootTaskError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ id: agent.id, name: agent.name, success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const identity = await resolveAuthIdentity(req)
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseAdmin

    const { data: userRow } = await (supabase.from('users') as any)
      .select('id')
      .eq('clerk_id', identity.externalUserId)
      .single()

    if (!userRow) {
      return NextResponse.json({ agents: [] })
    }

    const { data: agents, error } = await (supabase.from('agents') as any)
      .select('*')
      .eq('user_id', userRow.id)
      .order('deployed_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ agents })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
