import { supabaseAdmin } from '@/lib/supabase/client'
import { CompetitorIntelState } from '../types'

/**
 * Storage Agent: Persists intelligence reports to Supabase
 * Replaces n8n Google Sheets nodes: battle_cards, pricing_history, content_feed, ads_tracker, change_log
 */
export async function storageAgent(state: CompetitorIntelState): Promise<Partial<CompetitorIntelState>> {
  const report = state.report
  if (!report || report.threat_level === undefined) return {}

  const timestamp = new Date().toISOString()
  const alertsSent: string[] = []

  try {
    // Upsert battle card
    await (supabaseAdmin.from('competitor_battle_cards') as any).upsert({
      agent_id: state.agentId,
      competitor_name: report.competitor_name,
      threat_level: report.threat_level,
      threat_score: report.threat_score,
      threat_reason: report.threat_reason,
      pricing_summary: report.pricing?.key_change || '',
      pricing_tiers: JSON.stringify(report.pricing?.tiers || []),
      our_pricing_advantage: report.pricing?.our_advantage || '',
      new_features: (report.features?.new_features || []).join(', '),
      features_signal: report.features?.strategic_signal || '',
      our_feature_advantage: report.features?.our_advantage || '',
      content_themes: (report.content?.content_themes || []).join(', '),
      content_signal: report.content?.strategic_signal || '',
      active_ads: report.ads?.active_ad_count || 0,
      ad_key_message: report.ads?.key_message || '',
      ads_signal: report.ads?.strategic_signal || '',
      battle_card_summary: report.battle_card_summary,
      recommended_actions: (report.recommended_actions || []).join(' | '),
      last_updated: timestamp,
      pricing_changed: state.pricingChanged,
      features_changed: state.featuresChanged,
      content_changed: state.contentChanged,
      ads_changed: state.adsChanged,
    }, { onConflict: 'agent_id,competitor_name' })

    // Append to change log
    await (supabaseAdmin.from('competitor_change_log') as any).insert({
      agent_id: state.agentId,
      competitor_name: report.competitor_name,
      threat_level: report.threat_level,
      threat_score: report.threat_score,
      pricing_changed: state.pricingChanged,
      features_changed: state.featuresChanged,
      content_changed: state.contentChanged,
      ads_changed: state.adsChanged,
      battle_card_summary: report.battle_card_summary,
      recommended_actions: (report.recommended_actions || []).join(' | '),
      threat_reason: report.threat_reason,
      timestamp,
    })

    // Send Slack alert for threat score >= 5
    if (report.threat_score >= 5) {
      await sendSlackAlert(report, state)
      alertsSent.push(`slack:${report.competitor_name}`)
    }
  } catch (err) {
    console.error('[CompetitorIntel] Storage error:', err)
  }

  return { alertsSent }
}

async function sendSlackAlert(report: any, state: CompetitorIntelState): Promise<void> {
  const slackWebhook = process.env.SLACK_WEBHOOK_URL
  if (!slackWebhook) {
    console.log('[CompetitorIntel] Slack alert (no webhook configured):', report.competitor_name, report.threat_level)
    return
  }

  const emoji = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🔴', CRITICAL: '🚨', UNKNOWN: '⚪' }[report.threat_level] || '⚪'

  try {
    await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${emoji} *Competitor Alert: ${report.competitor_name}*`,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `${emoji} Competitor Intel: ${report.competitor_name}` },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Threat Level:*\n${report.threat_level} (${report.threat_score}/10)` },
              { type: 'mrkdwn', text: `*Pricing Changed:*\n${state.pricingChanged ? '✅ Yes' : '❌ No'}` },
              { type: 'mrkdwn', text: `*Features Changed:*\n${state.featuresChanged ? '✅ Yes' : '❌ No'}` },
              { type: 'mrkdwn', text: `*Ads Changed:*\n${state.adsChanged ? '✅ Yes' : '❌ No'}` },
            ],
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*Battle Card Summary:*\n${report.battle_card_summary}` },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Recommended Actions:*\n${(report.recommended_actions || []).map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}`,
            },
          },
        ],
      }),
    })
  } catch (err) {
    console.error('[CompetitorIntel] Slack send failed:', err)
  }
}
