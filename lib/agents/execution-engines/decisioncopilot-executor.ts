import { runDecisionCopilot } from '@/lib/agents/20-agents/decision-copilot/decision-copilot'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface DecisionCopilotContext {
  agentId: string
  userId?: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for Decision Copilot Agent
 * Provides 3 daily priorities based on business metrics
 *
 * Trigger: "What should I focus on?", scheduled daily brief, CEO dashboard
 */
export async function executeDecisionCopilot(
  userMessage: string,
  ctx: DecisionCopilotContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    // Parse business context from metadata
    const businessName = (ctx.metadata?.business_name as string) || 'Business'
    const businessMetrics = (ctx.metadata?.metrics as Record<string, unknown>) || {}
    const recentEvents = (ctx.metadata?.recent_events as string) || 'Standard operations'
    const userRole = (ctx.metadata?.user_role as string) || 'Manager'

    const result = await runDecisionCopilot({
      businessName,
      businessMetrics,
      recentEvents,
      userRole,
      decisionContext: userMessage,
    })

    const s = result.state
    const responseMessage = buildResponse(s)
    await storeExecution(s, ctx, userMessage)

    return {
      success: true,
      message: responseMessage,
      data: {
        executive_summary: s.executiveSummary,
        top_challenges: s.topChallenges,
        opportunities: s.opportunities,
        risks: s.risks,
        daily_brief: s.dailyBrief,
        action_items: s.actionItems,
        top_three_actions: s.topThreeActions,
        urgency_score: s.urgencyScore,
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[DecisionCopilot] Execution error:', msg)
    return {
      success: false,
      message: 'Daily brief generation failed.',
      data: { error: msg },
    }
  }
}

function buildResponse(s: any): string {
  let msg = `🎯 Today's 3 Priorities\n\n`

  s.topThreeActions.forEach((action: any, i: number) => {
    msg += `${i + 1}. ${action.action}\n`
    msg += `   Impact: ${action.impact}\n`
    msg += `   Deadline: ${action.deadline}\n\n`
  })

  msg += `💡 Executive Summary:\n${s.executiveSummary}\n`

  if (s.urgencyScore >= 8) {
    msg += `\n⚠️ HIGH URGENCY — Immediate action needed`
  }

  return msg
}

async function storeExecution(state: any, ctx: DecisionCopilotContext, userMessage: string): Promise<void> {
  try {
    await supabaseAdmin.from('agent_executions').insert({
      agent_id: ctx.agentId,
      agent_type: 'decisioncopilot',
      input: {
        message: userMessage,
        role: state.userRole,
      },
      output: {
        top_three_actions: state.topThreeActions,
        urgency_score: state.urgencyScore,
        action_count: state.actionItems.length,
      },
    })
  } catch (err) {
    console.error('[DecisionCopilot] Store error:', err)
  }
}
