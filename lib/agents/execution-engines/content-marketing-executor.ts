import { runContentMarketing } from '@/lib/agents/20-agents/content-marketing/content-marketing'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface ContentMarketingContext {
  agentId: string
  userId: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for Content Marketing Agent
 * Multi-channel content generation: 1 business update → 7 ideas → 5 platform variants each
 *
 * Trigger: "New feature launched" / "Just closed funding" / "Content calendar"
 */
export async function executeContentMarketing(
  userMessage: string,
  ctx: ContentMarketingContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    // Parse message as business update
    const businessUpdate = userMessage

    // Load past posts from metadata or agent config
    const pastPosts = (ctx.metadata?.past_posts as string[]) || []
    const brandVoice = (ctx.metadata?.brand_voice as string) || 'professional yet conversational'

    const result = await runContentMarketing({
      businessUpdate,
      brandVoice,
      pastPosts,
    })

    const s = result.state
    const responseMessage = buildResponse(s)
    await storeConversation(userMessage, responseMessage, ctx)

    return {
      success: true,
      message: responseMessage,
      data: {
        business_update: s.businessUpdate,
        total_ideas: s.generatedIdeas?.length || 0,
        total_content_pieces: s.contentVariants?.length || 0,
        platforms_scheduled: s.schedule?.platforms || 0,
        expected_reach: s.analytics?.expected_reach || 0,
        best_posting_time: s.analytics?.best_time,
        estimated_leads: s.analytics?.estimated_leads || 0,
        calendar_saved: s.calendar_saved,
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ContentMarketing] Execution error:', msg)
    return { success: false, message: 'Content Marketing ran into an issue.', data: { error: msg } }
  }
}

function buildResponse(s: any): string {
  let msg = `📅 Content Calendar Generated\n`
  msg += `📊 ${s.generatedIdeas?.length || 0} ideas → ${s.contentVariants?.length || 0} content pieces\n`
  msg += `🎯 ${s.schedule?.platforms || 0} platforms | Reach: ${s.analytics?.expected_reach || 0} people\n`
  if (s.analytics?.best_time) msg += `⏰ Best time: ${s.analytics.best_time}\n`
  if (s.analytics?.estimated_leads) msg += `💡 Est. leads: ${s.analytics.estimated_leads}\n`
  msg += s.calendar_saved ? `✅ Calendar saved to Supabase` : `⚠️ Save pending approval`
  return msg
}

async function storeConversation(
  userMessage: string,
  agentMessage: string,
  ctx: ContentMarketingContext
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
          channel: ctx.channel || 'api',
          status: 'active',
        })
        .select('id')
        .single()
      convId = (newConv as any)?.id
    }
    if (convId) {
      await (supabaseAdmin.from('messages') as any).insert([
        {
          conversation_id: convId,
          agent_id: ctx.agentId,
          role: 'user',
          content: userMessage,
          channel: ctx.channel || 'api',
        },
        {
          conversation_id: convId,
          agent_id: ctx.agentId,
          role: 'agent',
          content: agentMessage,
          channel: ctx.channel || 'api',
        },
      ])
    }
    await (supabaseAdmin.from('agent_executions') as any).insert({
      agent_id: ctx.agentId,
      agent_type: 'content-marketing',
      input: { message: userMessage, channel: ctx.channel },
      output: { message: agentMessage },
      conversation_id: convId,
    })
  } catch (err) {
    console.error('[ContentMarketing] Store error:', err)
  }
}
