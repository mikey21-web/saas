import { runEmailAutomator } from '@/lib/agents/20-agents/email-automator/email-automator'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface EmailAutomatorContext {
  agentId: string
  userId?: string
  channel?: string
  fromPhone?: string
  fromEmail?: string
  metadata?: Record<string, unknown>
}

/**
 * Executor for Email Automator Agent
 * Creates and schedules email sequences for customer journeys
 *
 * Trigger: "Create onboarding sequence", "Nurture campaign", etc.
 */
export async function executeEmailAutomator(
  userMessage: string,
  ctx: EmailAutomatorContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    // Parse email journey details from metadata
    const journeyName = (ctx.metadata?.journey_name as string) || 'Journey'
    const customerEmail = ctx.fromEmail || (ctx.metadata?.customer_email as string) || ''
    const customerName = (ctx.metadata?.customer_name as string) || 'Customer'
    const businessName = (ctx.metadata?.business_name as string) || 'Business'
    const journeyType =
      (ctx.metadata?.journey_type as 'onboarding' | 'nurture' | 'winback' | 'upsell' | 'educational') ||
      'onboarding'

    const result = await runEmailAutomator({
      journeyName,
      customerEmail,
      customerName,
      businessName,
      journeyType,
      journeyContext: userMessage,
    })

    const s = result.state
    const responseMessage = buildResponse(s)
    await storeExecution(s, ctx, userMessage)

    return {
      success: true,
      message: responseMessage,
      data: {
        journey_name: s.journeyName,
        journey_type: s.journeyType,
        sequence_length: s.sequenceLength,
        personalized: s.personalizationApplied,
        scheduled: s.scheduled,
        schedule_count: s.scheduleTimestamps.length,
        send_start_date: s.sendStartDate,
        tracking_enabled: s.trackingEnabled,
        analytics_setup: s.analyticsSetup,
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[EmailAutomator] Execution error:', msg)
    return {
      success: false,
      message: 'Email sequence creation failed.',
      data: { error: msg },
    }
  }
}

function buildResponse(s: any): string {
  let msg = `📧 Email Sequence Created\n`
  msg += `Journey: ${s.journeyName} (${s.journeyType})\n`
  msg += `📬 ${s.sequenceLength} emails generated\n`

  if (s.personalizationApplied) {
    msg += `✨ Personalization applied\n`
  }

  if (s.scheduled) {
    msg += `📅 Scheduled: ${s.scheduleTimestamps.length} sends\n`
    msg += `Starts: ${new Date(s.sendStartDate).toLocaleDateString('en-IN')}\n`
  }

  if (s.trackingEnabled) {
    msg += `📊 Analytics tracking enabled`
  }

  return msg
}

async function storeExecution(state: any, ctx: EmailAutomatorContext, userMessage: string): Promise<void> {
  try {
    await supabaseAdmin.from('agent_executions').insert({
      agent_id: ctx.agentId,
      agent_type: 'emailautomator',
      input: {
        message: userMessage,
        journey: state.journeyName,
        type: state.journeyType,
      },
      output: {
        sequence_length: state.sequenceLength,
        scheduled_count: state.scheduleTimestamps.length,
        personalized: state.personalizationApplied,
      },
    })
  } catch (err) {
    console.error('[EmailAutomator] Store error:', err)
  }
}
