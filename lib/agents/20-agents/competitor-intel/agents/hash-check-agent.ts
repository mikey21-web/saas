import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/client'
import { CompetitorIntelState } from '../types'

function md5(s: string): string {
  return crypto.createHash('md5').update(s).digest('hex')
}

/**
 * Hash Check Agent: Deduplicates by comparing content hashes
 * Only proceeds if something has actually changed since last run
 * Maps to n8n node: "Hash Check + Dedup"
 */
export async function hashCheckAgent(state: CompetitorIntelState): Promise<Partial<CompetitorIntelState>> {
  const competitor = state.currentCompetitor
  if (!competitor) return {}

  const key = competitor.name.replace(/\s/g, '_').toLowerCase()

  const pricingHash = md5(state.pricingText || '')
  const featuresHash = md5(state.featuresText || '')
  const rssHash = md5(state.rssText || '')
  const adsHash = md5(state.adsText || '')

  // Load previous hashes from Supabase
  const { data: prev } = await (supabaseAdmin.from('competitor_hashes') as any)
    .select('pricing_hash, features_hash, rss_hash, ads_hash')
    .eq('competitor_key', key)
    .eq('agent_id', state.agentId)
    .single()

  const pricingChanged = pricingHash !== (prev?.pricing_hash || '')
  const featuresChanged = featuresHash !== (prev?.features_hash || '')
  const contentChanged = rssHash !== (prev?.rss_hash || '')
  const adsChanged = adsHash !== (prev?.ads_hash || '')
  const anythingChanged = pricingChanged || featuresChanged || contentChanged || adsChanged

  // Update stored hashes
  await (supabaseAdmin.from('competitor_hashes') as any).upsert({
    competitor_key: key,
    agent_id: state.agentId,
    competitor_name: competitor.name,
    pricing_hash: pricingHash,
    features_hash: featuresHash,
    rss_hash: rssHash,
    ads_hash: adsHash,
    last_checked: new Date().toISOString(),
  }, { onConflict: 'competitor_key,agent_id' })

  return { pricingChanged, featuresChanged, contentChanged, adsChanged, anythingChanged }
}
