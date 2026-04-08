// @ts-nocheck - Supabase client types not properly generated
/**
 * Universal Agent Run Endpoint — works for all 20 agent types
 *
 * POST /api/agents/[id]/run
 * Body: { agentType, message, channel, fromPhone?, fromEmail?, conversationId?, metadata? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveAuthIdentity } from '@/lib/auth/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { executeAgent } from '@/lib/agents/agent-executor'
import { executeInvoiceBot } from '@/lib/agents/execution-engines/invoicebot-executor'
import { executeSocialMediaManager } from '@/lib/agents/execution-engines/social-media-manager-executor'
import { executeCustomerSupport } from '@/lib/agents/execution-engines/customer-support-executor'
import { executeAiSdr } from '@/lib/agents/execution-engines/ai-sdr-executor'
import { executeTaskMaster } from '@/lib/agents/execution-engines/taskmaster-executor'
import { executeEcommerce } from '@/lib/agents/execution-engines/ecommerce-executor'
import { executeCompetitorIntel } from '@/lib/agents/execution-engines/competitor-intel-executor'
import { executeSalesIntelligence } from '@/lib/agents/execution-engines/sales-intelligence-executor'
import { executeContentMarketing } from '@/lib/agents/execution-engines/content-marketing-executor'
import { executePaymentReminder } from '@/lib/agents/execution-engines/payment-reminder-executor'
import { executeAppointBot } from '@/lib/agents/execution-engines/appointbot-executor'
import { executeEmailAutomator } from '@/lib/agents/execution-engines/emailautomator-executor'
import { executeDecisionCopilot } from '@/lib/agents/execution-engines/decisioncopilot-executor'
import { executeAiCmo } from '@/lib/agents/execution-engines/ai-cmo-executor'
import { AgentType, AGENT_CATALOG } from '@/lib/agents/all-prompts'

const VALID_AGENT_TYPES = AGENT_CATALOG.map((a) => a.type)

interface RunRequestBody {
  agentType?: string
  message?: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  conversationId?: string
  metadata?: Record<string, unknown>
}

async function verifyOwnedAgentAndConversation(userId: string, agentId: string, conversationId?: string) {
  const { data: agent } = await (supabaseAdmin.from('agents') as any)
    .select('*')
    .eq('id', agentId)
    .eq('user_id', userId)
    .single()

  if (!agent) {
    return { ok: false as const, error: 'Agent not found' }
  }

  if (!conversationId) {
    return { ok: true as const, agent }
  }

  const { data: conversation } = await (supabaseAdmin.from('conversations') as any)
    .select('id')
    .eq('id', conversationId)
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .single()

  if (!conversation) {
    return { ok: false as const, error: 'Conversation not found' }
  }

  return { ok: true as const, agent }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params
    const body = (await request.json()) as RunRequestBody

    const { agentType, message, channel = 'api', fromPhone, fromEmail, conversationId, metadata } = body

    const identity = await resolveAuthIdentity(request)
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    if (!agentType || !message || typeof message !== 'string') {
      return NextResponse.json({ error: 'agentType and message are required' }, { status: 400 })
    }

    // Validate agent type
    if (!VALID_AGENT_TYPES.includes(agentType as AgentType)) {
      return NextResponse.json(
        { error: `Invalid agentType. Valid types: ${VALID_AGENT_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const access = await verifyOwnedAgentAndConversation(
      identity.supabaseUserId,
      agentId,
      conversationId
    )
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: 404 })
    }

    const agent = access.agent as any

    const agentMetadata =
      agent?.metadata && typeof agent.metadata === 'object'
        ? (agent.metadata as Record<string, unknown>)
        : undefined

    // InvoiceBot has specialized execution engine — no n8n, direct API calls
    if (agentType === 'invoicebot') {
      const result = await executeInvoiceBot(message, {
        businessName: agent.business_name || agent.name,
        businessGSTIN:
          typeof agentMetadata?.gst_number === 'string' ? agentMetadata.gst_number : undefined,
        businessAddress: typeof agentMetadata?.address === 'string' ? agentMetadata.address : undefined,
        tone: agent.tone || 'professional',
        evolutionInstanceName:
          typeof agentMetadata?.evolution_instance === 'string'
            ? agentMetadata.evolution_instance
            : undefined,
      })

      // Store conversation and message
      let convId = conversationId
      if (!convId) {
        const identifier = fromPhone || fromEmail || 'anonymous'
        const { data: existingConvData } = await (supabaseAdmin
          .from('conversations') as any)
          .select('id')
          .eq('agent_id', agentId)
          .eq('contact_phone_or_email', identifier)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const existingConv = existingConvData as any

        if (existingConv) {
          convId = existingConv.id
        } else {
          const { data: newConvData } = await (supabaseAdmin
            .from('conversations') as any)
            .insert({
              agent_id: agentId,
              user_id: agent.user_id,
              contact_phone_or_email: identifier,
              channel,
              status: 'active',
            })
            .select('id')
            .single()
          const newConv = newConvData as any
          convId = newConv?.id
        }
      }

      // Store messages
      if (convId) {
        await (supabaseAdmin.from('messages') as any).insert([
          {
            conversation_id: convId,
            agent_id: agentId,
            role: 'user',
            content: message,
            channel,
          },
          {
            conversation_id: convId,
            agent_id: agentId,
            role: 'agent',
            content: result.message,
            channel,
          },
        ])
      }

      // Log execution
      await supabaseAdmin.from('agent_executions').insert({
        agent_id: agentId,
        agent_type: agentType,
        input: { message, channel },
        output: { message: result.message, data: result.data },
        conversation_id: convId,
      })

      return NextResponse.json({
        success: true,
        response: result.message,
        data: result.data,
        conversationId: convId,
      })
    }

    // AI SDR — 6-agent LangGraph (Lead Finder → Outreach → Qualifier → Scheduler → Engagement → Analytics)
    if (agentType === 'ai-sdr') {
        const result = await executeAiSdr(message, {
          agentId,
          userId: identity.supabaseUserId,
        channel,
        fromPhone,
        fromEmail,
        metadata: agentMetadata,
      })
      return NextResponse.json({
        success: result.success,
        response: result.message,
        data: result.data,
      })
    }

    // TaskMaster — 5-agent LangGraph (Parser → Validator → Router → Notifier → Tracker)
    if (agentType === 'task-master') {
      const result = await executeTaskMaster(message, {
        agentId,
        userId: identity.supabaseUserId,
        channel,
        fromPhone,
        fromEmail,
        metadata: agentMetadata,
      })
      return NextResponse.json({
        success: result.success,
        response: result.message,
        data: result.data,
      })
    }

    // E-commerce Operations — Shopify webhook handler
    if (agentType === 'ecommerce') {
      const webhookTopic = (message || 'order.created').split(':')[0]
      const webhookPayload = typeof agentMetadata?.webhook === 'object' ? agentMetadata.webhook : {}

      const result = await executeEcommerce({
        agentId,
        userId: identity.supabaseUserId,
        channel,
        webhookTopic,
        webhookPayload,
        eventId: `${agentId}-${Date.now()}`,
      })

      return NextResponse.json({
        success: result.success,
        response: result.message,
        data: result.data,
      })
    }

    // Competitor Intelligence — monitors pricing, features, ads every 6h
    if (agentType === 'competitor-intel') {
      const result = await executeCompetitorIntel(message, {
        agentId,
        userId: identity.supabaseUserId,
        channel,
        fromPhone,
        fromEmail,
        metadata: agentMetadata,
      })
      return NextResponse.json({
        success: result.success,
        response: result.message,
        data: result.data,
      })
    }

    // Sales Intelligence — Unified agent combining conversation intent + revenue forecasting
    if (agentType === 'sales-intelligence') {
      const result = await executeSalesIntelligence(message, {
        agentId,
        userId: identity?.supabaseUserId,
        channel,
        fromPhone,
        fromEmail,
        metadata: agentMetadata,
      })
      return NextResponse.json({ success: result.success, response: result.message, data: result.data })
    }

    // Customer Support — converted from n8n UPLOAD.txt workflow
    if (agentType === 'customersupport') {
      const result = await executeCustomerSupport(message, {
        agentId,
        userId: identity.supabaseUserId,
        channel,
        fromPhone,
        fromEmail,
        metadata: agentMetadata,
      })

      return NextResponse.json({
        success: result.success,
        response: result.message,
        data: result.data,
      })
    }

    // Social Media Manager has specialized LangGraph execution engine
    if (agentType === 'social-media-manager') {
      const result = await executeSocialMediaManager(message, {
        agentId,
        userId: identity.supabaseUserId,
        channel,
        fromPhone,
        fromEmail,
        metadata: agentMetadata,
      })

      // Store conversation and message
      let convId = conversationId
      if (!convId) {
        const identifier = fromPhone || fromEmail || 'anonymous'
        const { data: existingConvData } = await (supabaseAdmin
          .from('conversations') as any)
          .select('id')
          .eq('agent_id', agentId)
          .eq('contact_phone_or_email', identifier)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const existingConv = existingConvData as any

        if (existingConv) {
          convId = existingConv.id
        } else {
          const { data: newConvData } = await (supabaseAdmin
            .from('conversations') as any)
            .insert({
              agent_id: agentId,
              user_id: agent.user_id,
              contact_phone_or_email: identifier,
              channel,
              status: 'active',
            })
            .select('id')
            .single()
          const newConv = newConvData as any
          convId = newConv?.id
        }
      }

      // Store messages
      if (convId) {
        await (supabaseAdmin.from('messages') as any).insert([
          {
            conversation_id: convId,
            agent_id: agentId,
            role: 'user',
            content: message,
            channel,
          },
          {
            conversation_id: convId,
            agent_id: agentId,
            role: 'agent',
            content: result.message,
            channel,
          },
        ])
      }

      // Log execution
      await supabaseAdmin.from('agent_executions').insert({
        agent_id: agentId,
        agent_type: agentType,
        input: { message, channel },
        output: { message: result.message, data: result.data },
        conversation_id: convId,
      })

      return NextResponse.json({
        success: true,
        response: result.message,
        data: result.data,
        conversationId: convId,
      })
    }

    // Content Marketing — Multi-channel content generation
    if (agentType === 'content-marketing') {
      const result = await executeContentMarketing(message, {
        agentId,
        userId: identity.supabaseUserId,
        channel,
        fromPhone,
        fromEmail,
        metadata: agentMetadata,
      })
      return NextResponse.json({
        success: result.success,
        response: result.message,
        data: result.data,
      })
    }

    // Payment Reminder — Smart payment collection
    if (agentType === 'paymentreminder') {
      const result = await executePaymentReminder(message, {
        agentId,
        userId: identity?.supabaseUserId,
        channel,
        fromPhone,
        fromEmail,
        metadata: agentMetadata,
      })
      return NextResponse.json({
        success: result.success,
        response: result.message,
        data: result.data,
      })
    }

    // AppointBot — Appointment booking and no-show management
    if (agentType === 'appointbot') {
      const result = await executeAppointBot(message, {
        agentId,
        userId: identity?.supabaseUserId,
        channel,
        fromPhone,
        fromEmail,
        metadata: agentMetadata,
      })
      return NextResponse.json({
        success: result.success,
        response: result.message,
        data: result.data,
      })
    }

    // Email Automator — Email sequence generation and scheduling
    if (agentType === 'emailautomator') {
      const result = await executeEmailAutomator(message, {
        agentId,
        userId: identity?.supabaseUserId,
        channel,
        fromPhone,
        fromEmail,
        metadata: agentMetadata,
      })
      return NextResponse.json({
        success: result.success,
        response: result.message,
        data: result.data,
      })
    }

    // Decision Copilot — Daily business priorities
    if (agentType === 'decisioncopilot') {
      const result = await executeDecisionCopilot(message, {
        agentId,
        userId: identity?.supabaseUserId,
        channel,
        fromPhone,
        fromEmail,
        metadata: agentMetadata,
      })
      return NextResponse.json({
        success: result.success,
        response: result.message,
        data: result.data,
      })
    }

    // AI CMO — scrapes website, analyzes brand, generates content
    if (agentType === 'ai-cmo') {
      const result = await executeAiCmo(message, {
        agentId,
        userId: identity?.supabaseUserId,
        channel,
        metadata: agentMetadata,
      })
      return NextResponse.json({ success: result.success, response: result.message, data: result.data })
    }

    // All other agents use generic executor
    const result = await executeAgent({
      agentId,
      agentType: agentType as AgentType,
      message,
      channel,
      fromPhone,
      fromEmail,
      conversationId,
      metadata,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      data: result.parsedData,
      action: result.action,
      conversationId: result.conversationId,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET — verify the agent exists and its type
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const identity = await resolveAuthIdentity(request)
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: agentId } = await params
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('id')
    .eq('id', agentId)
    .eq('user_id', identity.supabaseUserId)
    .single()

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json({
    agentId,
    availableTypes: AGENT_CATALOG.map((a) => ({
      type: a.type,
      name: a.name,
      description: a.description,
      category: a.category,
    })),
    usage: {
      endpoint: `POST /api/agents/${agentId}/run`,
      body: {
        agentType: 'leadcatcher | customersupport | salescloser | ...',
        message: 'The customer message or trigger',
        channel: 'whatsapp | email | api | widget',
        fromPhone: '+919876543210 (optional)',
        fromEmail: 'user@example.com (optional)',
        conversationId: 'existing conversation id (optional)',
      },
    },
  })
}
