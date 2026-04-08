import { CompetitorIntelState } from '../types'

const MAX_TEXT = 8000

function cleanHtml(html: string): string {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, MAX_TEXT)
}

async function safeFetch(url: string): Promise<string> {
  if (!url) return ''
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CompetitorIntelBot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return ''
    const text = await res.text()
    return cleanHtml(text)
  } catch {
    return ''
  }
}

async function fetchMetaAds(metaPageId: string): Promise<string> {
  if (!metaPageId || !process.env.META_ACCESS_TOKEN) return ''
  try {
    const url = new URL('https://graph.facebook.com/v19.0/ads_archive')
    url.searchParams.set('access_token', process.env.META_ACCESS_TOKEN)
    url.searchParams.set('ad_reached_countries', "['IN']")
    url.searchParams.set('search_page_ids', metaPageId)
    url.searchParams.set('ad_active_status', 'ACTIVE')
    url.searchParams.set('fields', 'id,ad_creative_body,ad_creative_link_title,ad_delivery_start_time,impressions')
    url.searchParams.set('limit', '10')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return ''
    const json = await res.json()
    return JSON.stringify(json.data || []).substring(0, 3000)
  } catch {
    return ''
  }
}

/**
 * Scraper Agent: Fetches pricing, features, RSS, Meta ads for one competitor
 * Maps to n8n nodes: Scrape Pricing, Scrape Features, Fetch RSS, Fetch Meta Ad Library
 */
export async function scraperAgent(state: CompetitorIntelState): Promise<Partial<CompetitorIntelState>> {
  const competitor = state.currentCompetitor
  if (!competitor) return { error: 'No competitor set' }

  const [pricingText, featuresText, rssText, adsText] = await Promise.all([
    safeFetch(competitor.pricing_url),
    safeFetch(competitor.features_url),
    competitor.rss_url ? safeFetch(competitor.rss_url) : Promise.resolve(''),
    competitor.meta_page_id ? fetchMetaAds(competitor.meta_page_id) : Promise.resolve(''),
  ])

  return { pricingText, featuresText, rssText, adsText }
}
