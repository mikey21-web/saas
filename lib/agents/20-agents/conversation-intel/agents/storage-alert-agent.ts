import { supabaseAdmin } from '@/lib/supabase/client'
import { ConversationIntelState } from '../types'

/**
 * Storage + Alert Agent: Saves to Supabase, updates CRM, sends Slack if needed
 * Maps to n8n: Save to Supabase + Update CRM Contact + Draft Slack Alert + Slack Alert
 */
export async function storageAlertAgent(state: ConversationIntelState): Promise<Partial<ConversationIntelState>> {
  let slackAlertSent = false

  await Promise.all([
    // Save conversation message
    (supabaseAdmin.from('conversation_history') as any).insert({
      phone: state.from,
      role: 'customer',
      text: state.text,
      intent_score: state.intentScore,
      emotion: state.emotion,
      stage: state.stage,
      created_at: state.timestamp,
    }),

    // Update CRM contact
    (supabaseAdmin.from('contacts') as any)
      .update({
        intent_score: state.intentScore,
        urgency: state.urgency,
        stage: state.stage,
        emotion: state.emotion,
        churn_risk: state.churnRisk,
        upsell_opportunity: state.upsellOpportunity,
        last_intel_at: state.timestamp,
        next_best_action: state.nextBestAction,
      })
      .eq('phone', state.from),
  ]).catch(err => console.error('[ConvIntel] Storage error:', err))

  // Send Slack alert if triggered
  if (state.shouldAlert) {
    slackAlertSent = await sendSlackAlert(state)
  }

  return { slackAlertSent }
}

async function sendSlackAlert(state: ConversationIntelState): Promise<boolean> {
  const webhook = process.env.SLACK_WEBHOOK_URL
  if (!webhook) {
    console.log('[ConvIntel] Slack alert (no webhook):', state.contactName, state.intentScore)
    return false
  }

  const alertText = buildAlertText(state)

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: alertText, channel: '#sales-alerts' }),
    })
    return true
  } catch {
    return false
  }
}

function buildAlertText(state: ConversationIntelState): string {
  const lines: string[] = []

  if (state.intentScore >= 8) {
    lines.push(`🔥 *High Intent Alert* — ${state.contactName} (${state.from})`)
    lines.push(`Intent: ${state.intentScore}/10 | Stage: ${state.stage} | Urgency: ${state.urgency}`)
  } else if (state.isVip && state.emotion === 'frustrated') {
    lines.push(`⚠️ *VIP Frustrated* — ${state.contactName} (₹${state.dealValue} deal)`)
    lines.push(`Emotion: ${state.emotion} | Stage: ${state.stage}`)
  } else if (state.churnRisk) {
    lines.push(`🚨 *Churn Risk* — ${state.contactName} (${state.from})`)
    lines.push(`Stage: ${state.stage} | Deal: ₹${state.dealValue || 'unknown'}`)
  }

  lines.push(`Next action: ${state.nextBestAction}`)
  lines.push(`Summary: ${state.summary}`)

  return lines.join('\n')
}
