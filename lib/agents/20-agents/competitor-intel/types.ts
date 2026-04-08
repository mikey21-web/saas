import { Annotation } from '@langchain/langgraph'

export interface Competitor {
  name: string
  website: string
  pricing_url: string
  features_url: string
  rss_url?: string
  meta_page_id?: string
}

export interface PricingAnalysis {
  changed: boolean
  tiers: { name: string; price: string; features: string[] }[]
  key_change: string
  strategic_signal: string
  our_advantage: string
}

export interface FeaturesAnalysis {
  changed: boolean
  new_features: string[]
  removed_features: string[]
  key_change: string
  strategic_signal: string
  our_advantage: string
}

export interface ContentAnalysis {
  changed: boolean
  latest_posts: { title: string; topic: string; date: string }[]
  content_themes: string[]
  strategic_signal: string
}

export interface AdsAnalysis {
  changed: boolean
  active_ad_count: number
  ad_themes: string[]
  key_message: string
  strategic_signal: string
}

export interface IntelligenceReport {
  competitor_name: string
  threat_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN'
  threat_score: number
  threat_reason: string
  pricing: PricingAnalysis
  features: FeaturesAnalysis
  content: ContentAnalysis
  ads: AdsAnalysis
  battle_card_summary: string
  recommended_actions: string[]
}

export const CompetitorIntelAnnotation = Annotation.Root({
  // Input
  agentId: Annotation<string>,
  userId: Annotation<string>,
  competitors: Annotation<Competitor[]>,
  runId: Annotation<string>,
  runAt: Annotation<string>,

  // Per-competitor scrape results (one competitor at a time)
  currentCompetitor: Annotation<Competitor | null>,
  pricingText: Annotation<string>,
  featuresText: Annotation<string>,
  rssText: Annotation<string>,
  adsText: Annotation<string>,

  // Hash check
  pricingChanged: Annotation<boolean>,
  featuresChanged: Annotation<boolean>,
  contentChanged: Annotation<boolean>,
  adsChanged: Annotation<boolean>,
  anythingChanged: Annotation<boolean>,

  // Analysis
  report: Annotation<IntelligenceReport | null>,

  // Output accumulation
  reports: Annotation<IntelligenceReport[], {
    reducer: (a: IntelligenceReport[], b: IntelligenceReport[]) => IntelligenceReport[]
    default: () => IntelligenceReport[]
  }>,
  alertsSent: Annotation<string[]>,
  error: Annotation<string | null>,
})

export type CompetitorIntelState = typeof CompetitorIntelAnnotation.State
