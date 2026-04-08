import { runCompetitorIntelWorkflow, Competitor } from '@/lib/agents/20-agents/competitor-intel'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface CompetitorIntelContext {
  agentId: string
  userId: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for Competitor Intelligence Agent
 * Monitors competitor pricing, features, content, ads every 6 hours
 * Alerts on changes with threat scoring (1-10)
 *
 * Input: "monitor competitors" / "check competitors" / "run intelligence"
 * OR: metadata.competitors = [{name, website, pricing_url, features_url}]
 */
export async function executeCompetitorIntel(
  userMessage: string,
  ctx: CompetitorIntelContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    // Load competitors from agent metadata or use defaults from message
    const competitors = loadCompetitors(ctx.metadata)

    if (competitors.length === 0) {
      return {
        success: false,
        message: 'No competitors configured. Add competitors in agent settings under metadata.competitors.',
        data: { competitors_count: 0 },
      }
    }

    const result = await runCompetitorIntelWorkflow({
      agentId: ctx.agentId,
      userId: ctx.userId,
      competitors,
    })

    const responseMessage = buildResponseMessage(result)
    await storeConversation(userMessage, responseMessage, ctx)

    return {
      success: true,
      message: responseMessage,
      data: {
        competitors_checked: result.competitors_checked,
        changes_detected: result.changes_detected,
        high_threats: result.high_threats,
        reports: result.reports.map(r => ({
          name: r.competitor_name,
          threat_level: r.threat_level,
          threat_score: r.threat_score,
          summary: r.battle_card_summary,
        })),
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[CompetitorIntel] Execution error:', msg)
    return {
      success: false,
      message: 'Competitor Intelligence ran into an issue. Please try again.',
      data: { error: msg },
    }
  }
}

function loadCompetitors(metadata?: Record<string, unknown>): Competitor[] {
  if (!metadata?.competitors) return []

  try {
    const raw = Array.isArray(metadata.competitors)
      ? metadata.competitors
      : JSON.parse(metadata.competitors as string)

    return (raw as any[]).filter(
      c => c.name && c.pricing_url && c.features_url
    ) as Competitor[]
  } catch {
    return []
  }
}

function buildResponseMessage(result: {
  competitors_checked: number
  changes_detected: number
  high_threats: number
  reports: any[]
}): string {
  if (result.competitors_checked === 0) {
    return 'No competitors to monitor.'
  }

  let msg = `🕵️ Monitored ${result.competitors_checked} competitor(s). `

  if (result.changes_detected === 0) {
    msg += 'No changes detected since last run.'
  } else {
    msg += `${result.changes_detected} change(s) detected.`
    if (result.high_threats > 0) {
      msg += ` ⚠️ ${result.high_threats} HIGH/CRITICAL threat(s) — check Slack for alerts.`
    }
  }

  const topThreats = result.reports
    .filter((r: any) => r.threat_score >= 5)
    .sort((a: any, b: any) => b.threat_score - a.threat_score)
    .slice(0, 3)

  if (topThreats.length > 0) {
    msg += '\n\nTop threats:\n'
    topThreats.forEach((r: any) => {
      msg += `• ${r.competitor_name}: ${r.threat_level} (${r.threat_score}/10)\n`
    })
  }

  return msg.trim()
}

async function storeConversation(
  userMessage: string,
  agentMessage: string,
  ctx: CompetitorIntelContext
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
        { conversation_id: convId, agent_id: ctx.agentId, role: 'user', content: userMessage, channel: ctx.channel || 'api' },
        { conversation_id: convId, agent_id: ctx.agentId, role: 'agent', content: agentMessage, channel: ctx.channel || 'api' },
      ])
    }

    await (supabaseAdmin.from('agent_executions') as any).insert({
      agent_id: ctx.agentId,
      agent_type: 'competitor-intel',
      input: { message: userMessage, channel: ctx.channel },
      output: { message: agentMessage },
      conversation_id: convId,
    })
  } catch (err) {
    console.error('[CompetitorIntel] Error storing conversation:', err)
  }
}
