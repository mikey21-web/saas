import { supabaseAdmin } from '@/lib/supabase/client'
import { ContentMarketingState } from '../types'

/**
 * Delivery Agent: Save to Supabase, send approval email
 */
export async function deliveryAgent(state: ContentMarketingState): Promise<Partial<ContentMarketingState>> {
  let calendar_saved = false
  let analytics_sent = false

  // Save calendar to Supabase
  try {
    const packageData = {
      business_update: state.businessUpdate,
      brand_voice: state.businessVoice,
      schedule: state.schedule,
      analytics: state.analytics,
      selected_variants: state.selectedVariants,
      created_at: new Date().toISOString(),
    }

    await (supabaseAdmin.from('content_packages') as any).insert(packageData)
    calendar_saved = true
  } catch (err) {
    console.error('[ContentMarketing] DB save failed:', err)
  }

  // Send approval email with summary
  try {
    const topVariant = state.selectedVariants?.[0]
    const summary = `
Content Calendar Generated:
- Business Update: ${state.businessUpdate}
- Total Platforms: ${state.schedule?.platforms || 0}
- Estimated Reach: ${state.analytics?.expected_reach || 0}
- Best Time: ${state.analytics?.best_time || 'TBD'}

Top Platform: ${topVariant?.platform || 'LinkedIn'}
Content Preview: ${topVariant?.content?.slice(0, 100) || 'N/A'}...
`

    const webhook = process.env.APPROVAL_WEBHOOK_URL
    if (webhook) {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'content_approval_request',
          business_update: state.businessUpdate,
          summary,
          schedule: state.schedule,
          analytics: state.analytics,
          timestamp: new Date().toISOString(),
        }),
      })
      analytics_sent = true
    }
  } catch (err) {
    console.error('[ContentMarketing] Approval webhook failed:', err)
  }

  return {
    calendar_saved,
    analytics_sent,
  }
}
