import { Annotation } from '@langchain/langgraph'

export interface BrandProfile {
  brandName: string
  industry: string
  tone: string[]           // e.g. ['bold', 'direct', 'witty']
  voice: string            // paragraph describing the brand voice
  targetAudience: string
  keyMessages: string[]
  contentPillars: string[]
  uniqueValueProp: string
  competitors: string[]
  colorVibe: string        // e.g. 'dark, professional, minimalist'
  writingStyle: string     // e.g. 'short sentences, data-backed, no fluff'
  emotionalTriggers: string[] // e.g. ['fear of missing out', 'aspiration', 'trust']
  callToAction: string
}

export interface ContentPiece {
  platform: 'linkedin' | 'twitter' | 'instagram' | 'blog' | 'email' | 'whatsapp'
  type: 'post' | 'thread' | 'article' | 'newsletter' | 'story'
  title?: string
  content: string
  hashtags?: string[]
  cta?: string
}

export interface MarketingStrategy {
  summary: string
  primaryChannel: string
  contentCalendar: Array<{ day: string; pillar: string; format: string; idea: string }>
  quickWins: string[]
  monthlyGoals: string[]
}

export interface AiCmoState {
  // Input
  websiteUrl: string
  userRequest: string
  agentId: string

  // Scraper output
  scrapedContent: string
  scrapedPages: string[]
  scrapeError: string | null

  // Brand Analyzer output
  brandProfile: BrandProfile | null
  brandConfidence: number // 1-10

  // Strategy Builder output
  marketingStrategy: MarketingStrategy | null

  // Content Generator output
  generatedContent: ContentPiece[]
  contentSummary: string

  // Meta
  summary: string
  error: string | null
}

export const AiCmoAnnotation = Annotation.Root({
  websiteUrl: Annotation<string>({ reducer: (_, b) => b }),
  userRequest: Annotation<string>({ reducer: (_, b) => b }),
  agentId: Annotation<string>({ reducer: (_, b) => b }),
  scrapedContent: Annotation<string>({ reducer: (_, b) => b }),
  scrapedPages: Annotation<string[]>({ reducer: (_, b) => b }),
  scrapeError: Annotation<string | null>({ reducer: (_, b) => b }),
  brandProfile: Annotation<BrandProfile | null>({ reducer: (_, b) => b }),
  brandConfidence: Annotation<number>({ reducer: (_, b) => b }),
  marketingStrategy: Annotation<MarketingStrategy | null>({ reducer: (_, b) => b }),
  generatedContent: Annotation<ContentPiece[]>({ reducer: (_, b) => b }),
  contentSummary: Annotation<string>({ reducer: (_, b) => b }),
  summary: Annotation<string>({ reducer: (_, b) => b }),
  error: Annotation<string | null>({ reducer: (_, b) => b }),
})
