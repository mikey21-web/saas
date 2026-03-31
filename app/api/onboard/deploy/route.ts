import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

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

interface DeployRequest {
  agentType: string
  agentIcon: string
  config: AgentConfig
  userId: string
  plan: 'intern' | 'agent'
  paymentId?: string
  skipPayment?: boolean // Create agent but don't activate until payment
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as DeployRequest
    const { agentType, agentIcon, config, userId, plan, skipPayment } = body

    const supabase = supabaseAdmin

    // Create the agent in the database
    const agentData = {
      user_id: userId,
      name: config.agentName || `${agentType} Agent`,
      business_name: config.businessName || 'My Business',
      industry: config.industry || 'General',
      products: config.products || '',
      tone: config.tone || 'friendly',
      language: config.language || 'English',
      status: skipPayment ? 'pending' : 'active', // pending until payment confirmed
      model_tier: plan === 'agent' ? 'balanced' : 'fast',
      channels: ['whatsapp', 'email'],
      knowledge_base: config.keyInstructions
        ? `Business: ${config.businessName}\nProducts: ${config.products}\nTarget Customers: ${config.targetCustomers}\nInstructions: ${config.keyInstructions}`
        : `Business: ${config.businessName}\nProducts: ${config.products}`,
      template_id: agentType,
      icon: agentIcon,
      active_hours: config.activeHours || '9:00-21:00',
      monthly_call_limit: plan === 'agent' ? 500 : 100,
      monthly_email_limit: plan === 'agent' ? 2000 : 500,
      monthly_whatsapp_limit: plan === 'agent' ? 1000 : 0,
      deployed_at: skipPayment ? null : new Date().toISOString(),
    }

    const { data: agent, error } = await (supabase.from('agents') as any)
      .insert(agentData)
      .select()
      .single()

    if (error) {
      console.error('Deploy error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    // Log activity
    await (supabase.from('activity_logs') as any).insert({
      user_id: userId,
      agent_id: agent.id,
      action: 'agent_deployed',
      details: {
        agentType,
        plan,
        businessName: config.businessName,
        configuredVia: 'smart_onboard',
      },
    })

    return NextResponse.json({
      success: true,
      agentId: agent.id,
      agentName: agent.name,
    })

  } catch (err) {
    console.error('Deploy failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
