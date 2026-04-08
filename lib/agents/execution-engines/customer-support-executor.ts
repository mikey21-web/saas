import { runCustomerSupport } from '@/lib/agents/20-agents/customer-support'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface CustomerSupportContext {
  agentId: string
  userId: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for Customer Support Agent
 * Converted from n8n workflow: "AI Customer-Support Assistant · WhatsApp Ready"
 *
 * n8n nodes converted:
 * - WhatsApp Trigger      → webhook trigger (handled by API route)
 * - AI Agent              → aiAgent (with list_links + get_page tools)
 * - 24-hour window check  → timeCheckAgent
 * - cleanAnswer           → cleanAnswerAgent
 * - Send AI Answer        → senderAgent (withinWindow = true)
 * - Send Template         → senderAgent (withinWindow = false)
 * - Postgres Memory       → saveMessage / loadConversationHistory
 */
export async function executeCustomerSupport(
  userMessage: string,
  ctx: CustomerSupportContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    // Load agent config from Supabase
    const { data: agentData, error } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', ctx.agentId)
      .eq('user_id', ctx.userId)
      .single()

    if (error || !agentData) {
      return { success: false, message: 'Agent not found. Please check your setup.' }
    }

    const agent = agentData as Record<string, unknown>
    const metadata = (agent.metadata as Record<string, unknown>) || {}

    const companyName = (agent.business_name as string) || (agent.name as string) || 'Our Company'
    const websiteUrl = (metadata.website_url as string) || ''
    const phoneNumber = ctx.fromPhone || ''
    const userId = ctx.fromPhone || ctx.fromEmail || ctx.agentId

    // Run LangGraph (converted from n8n workflow)
    const result = await runCustomerSupport({
      userId,
      phoneNumber,
      userMessage,
      messageTimestamp: Date.now(),
      companyName,
      websiteUrl,
    })

    // Store conversation to Supabase
    await storeConversation(userMessage, result.answer, ctx)

    return {
      success: true,
      message: result.answer,
      data: { sent: result.sent, channel: ctx.channel },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CustomerSupport] Execution error:', msg)
    return {
      success: false,
      message: "I'm having trouble right now. Please try again in a moment.",
      data: { error: msg },
    }
  }
}

async function storeConversation(
  userMessage: string,
  agentMessage: string,
  ctx: CustomerSupportContext
): Promise<void> {
  try {
    const identifier = ctx.fromPhone || ctx.fromEmail || 'api'

    const { data: existingConv } = await (supabaseAdmin.from('conversations') as any)
      .select('id')
      .eq('agent_id', ctx.agentId)
      .eq('contact_phone_or_email', identifier)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let convId = (existingConv as any)?.id

    if (!convId) {
      const { data: newConv } = await (supabaseAdmin.from('conversations') as any)
        .insert({
          agent_id: ctx.agentId,
          user_id: ctx.userId,
          contact_phone_or_email: identifier,
          channel: ctx.channel || 'whatsapp',
          status: 'active',
        })
        .select('id')
        .single()
      convId = (newConv as any)?.id
    }

    if (convId) {
      await (supabaseAdmin.from('messages') as any).insert([
        { conversation_id: convId, agent_id: ctx.agentId, role: 'user', content: userMessage, channel: ctx.channel || 'whatsapp' },
        { conversation_id: convId, agent_id: ctx.agentId, role: 'agent', content: agentMessage, channel: ctx.channel || 'whatsapp' },
      ])
    }

    await (supabaseAdmin.from('agent_executions') as any).insert({
      agent_id: ctx.agentId,
      agent_type: 'customersupport',
      input: { message: userMessage, channel: ctx.channel },
      output: { message: agentMessage },
      conversation_id: convId,
    })
  } catch (err) {
    console.error('[CustomerSupport] Error storing conversation:', err)
  }
}
