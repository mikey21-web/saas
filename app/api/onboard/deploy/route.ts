import { NextRequest, NextResponse } from 'next/server'
import { resolveAuthIdentity } from '@/lib/auth/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { saveAgentCredentials } from '@/lib/supabase/credentials'

export const runtime = 'nodejs'

interface AgentConfig {
  businessName: string
  industry: string
  products: string
  targetCustomers: string
  tone: string
  language: string
  agentPersonality: string
  activeHours: string
  keyInstructions: string
  agentName: string
}

interface AgentCredentials {
  whatsapp_number?: string
  website_url?: string
  openai_api_key?: string
  groq_api_key?: string
  use_diyaa_ai_powered?: boolean
  n8n_webhook_url?: string // For workflow execution agents like InvoiceBot
}

interface DeployRequest {
  agentType: string
  agentIcon: string
  config: AgentConfig
  userId: string
  plan: 'intern' | 'agent'
  credentials?: AgentCredentials // New: credentials collection
  paymentId?: string
  skipPayment?: boolean // Create agent but don't activate until payment
  isFreeTrialat?: boolean // Free trial - no payment required, 7 days active
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DeployRequest
    const { agentType, config, userId, plan, credentials } = body

    const identity = await resolveAuthIdentity(req)
    const externalUserId = identity?.externalUserId || userId
    const resolvedSupabaseUserId = identity?.supabaseUserId

    if (!externalUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseAdmin

    // Parse active hours (e.g., "9:00-21:00" → start: 9, end: 21)
    const [startStr, endStr] = (config.activeHours || '9:00-21:00').split('-')
    const active_hours_start = parseInt(startStr?.split(':')[0] || '9', 10)
    const active_hours_end = parseInt(endStr?.split(':')[0] || '21', 10)

    // Build system prompt from config
    const systemPrompt = `You are a business automation agent for ${config.businessName} (${config.industry}).

Business Overview:
- Name: ${config.businessName}
- Industry: ${config.industry}
- Target Customers: ${config.targetCustomers}
- Products/Services: ${config.products}

Personality & Behavior:
- Tone: ${config.tone}
- Language: ${config.language}

Special Instructions:
${config.keyInstructions || 'Follow best practices for your industry.'}

Always respond professionally, helpfully, and accurately.`

    // Resolve Supabase UUID from Clerk ID
    // First try to find existing user record
    let supabaseUserId: string = resolvedSupabaseUserId || externalUserId
    if (!resolvedSupabaseUserId) {
      const { data: existingUser } = await (supabase.from('users') as any)
        .select('id')
        .eq('clerk_id', externalUserId)
        .single()

      if (existingUser) {
        supabaseUserId = existingUser.id
      } else {
        const { data: newUser, error: userError } = await (supabase.from('users') as any)
          .insert({ clerk_id: externalUserId, email: `${externalUserId}@placeholder.diyaa.ai` })
          .select('id')
          .single()
        if (userError) {
          return NextResponse.json(
            { success: false, error: 'Failed to create user record' },
            { status: 500 }
          )
        }
        supabaseUserId = newUser.id
      }
    }

    // Create the agent in the database using correct column names
    const metadata: Record<string, unknown> = {}
    if (credentials?.n8n_webhook_url) {
      metadata.n8n_webhook_url = credentials.n8n_webhook_url
    }
    if (
      agentType === 'invoicebot' &&
      !metadata.n8n_webhook_url &&
      process.env.INVOICEBOT_N8N_WEBHOOK_URL
    ) {
      metadata.n8n_webhook_url = process.env.INVOICEBOT_N8N_WEBHOOK_URL
    }

    const agentData = {
      user_id: supabaseUserId,
      name: config.agentName || `${agentType} Agent`,
      template_id: agentType,
      agent_type: agentType, // used by executor to pick the right prompt
      status: 'active',
      description: `AI automation agent for ${config.businessName}`,
      system_prompt: systemPrompt,
      business_name: config.businessName || 'My Business',
      business_industry: config.industry || 'General',
      business_description: config.products || '',
      tone:
        config.tone === 'friendly'
          ? 'friendly'
          : config.tone === 'casual'
            ? 'casual'
            : 'professional',
      channels_whatsapp: true,
      channels_email: true,
      channels_sms: false,
      channels_phone: false,
      ai_model: 'groq',
      ai_model_tier: plan === 'agent' ? 'balanced' : 'fast',
      active_hours_start,
      active_hours_end,
      active_hours_timezone: 'Asia/Kolkata',
      deployed_at: new Date().toISOString(),
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    }

    const { data: agent, error } = await (supabase.from('agents') as any)
      .insert(agentData)
      .select()
      .single()

    if (error) {
      // console.error('Deploy error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      )
    }

    // Store knowledge base as knowledge_documents
    if (config.keyInstructions) {
      await (supabase.from('knowledge_documents') as any).insert({
        agent_id: agent.id,
        user_id: supabaseUserId,
        title: 'Agent Instructions',
        content: config.keyInstructions,
        source: 'manual',
      })
    }

    // Save credentials if provided (encrypted in agent_credentials table)
    if (credentials) {
      const credResult = await saveAgentCredentials(supabaseUserId, agent.id, credentials)
      if (!credResult.success) {
        // console.warn('Failed to save credentials:', credResult.error)
        // Don't fail deployment, just warn
      }
    }

    // Log activity
    await (supabase.from('activity_logs') as any).insert({
      user_id: supabaseUserId,
      agent_id: agent.id,
      action: 'agent_deployed',
      details: {
        agentType,
        plan,
        businessName: config.businessName,
        configuredVia: 'smart_onboard',
        hasCredentials: !!credentials,
      },
    })

    return NextResponse.json({
      success: true,
      agentId: agent.id,
      agentName: agent.name,
    })
  } catch (err) {
    // console.error('Deploy failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
