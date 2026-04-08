import { runAiCmo } from '@/lib/agents/20-agents/ai-cmo/ai-cmo'
import { supabaseAdmin } from '@/lib/supabase/client'
import { ContentPiece, BrandProfile, MarketingStrategy } from '@/lib/agents/20-agents/ai-cmo/types'

export interface AiCmoContext {
  agentId: string
  userId?: string
  channel?: string
  metadata?: Record<string, unknown>
}

export async function executeAiCmo(
  userMessage: string,
  ctx: AiCmoContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    // Extract website URL from metadata or message
    const websiteUrl =
      (ctx.metadata?.website_url as string) ||
      extractUrlFromMessage(userMessage) ||
      ''

    if (!websiteUrl) {
      return {
        success: false,
        message: 'Please provide your website URL so I can analyze your brand. Example: "Analyze https://yoursite.com and write a LinkedIn post"',
      }
    }

    const result = await runAiCmo({
      websiteUrl,
      userRequest: userMessage,
      agentId: ctx.agentId,
    })

    const s = result.state
    const responseMessage = buildResponse(s)

    // Store execution
    await (supabaseAdmin.from('agent_executions') as any).insert({
      agent_id: ctx.agentId,
      agent_type: 'ai-cmo',
      input: { message: userMessage, website: websiteUrl },
      output: {
        brand_name: s.brandProfile?.brandName,
        pages_scraped: s.scrapedPages?.length,
        content_pieces: s.generatedContent?.length,
        brand_confidence: s.brandConfidence,
      },
    })

    return {
      success: true,
      message: responseMessage,
      data: {
        brandProfile: s.brandProfile,
        brandConfidence: s.brandConfidence,
        marketingStrategy: s.marketingStrategy,
        generatedContent: s.generatedContent,
        pagesScraped: s.scrapedPages,
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[AiCmo] Error:', msg)
    return {
      success: false,
      message: 'AI CMO ran into an issue analyzing the website. Please try again.',
      data: { error: msg },
    }
  }
}

function extractUrlFromMessage(message: string): string | null {
  const urlMatch = message.match(/https?:\/\/[^\s]+/)
  return urlMatch ? urlMatch[0] : null
}

function buildResponse(s: {
  scrapeError: string | null
  scrapedPages: string[]
  brandProfile: BrandProfile | null
  brandConfidence: number
  marketingStrategy: MarketingStrategy | null
  generatedContent: ContentPiece[]
  contentSummary: string
  error: string | null
}): string {
  if (s.scrapeError) {
    return `⚠️ Could not scrape the website: ${s.scrapeError}\n\nPlease check the URL and try again.`
  }

  if (!s.brandProfile) {
    return `⚠️ Could not analyze the brand from the website content. The site may not have enough text content.`
  }

  const b = s.brandProfile
  let msg = ''

  // Brand Profile Summary
  msg += `🎯 **Brand Analysis — ${b.brandName}**\n\n`
  msg += `**Industry:** ${b.industry}\n`
  msg += `**Tone:** ${b.tone.join(', ')}\n`
  msg += `**Audience:** ${b.targetAudience}\n`
  msg += `**Voice:** ${b.voice}\n`
  msg += `**Unique Value:** ${b.uniqueValueProp}\n`
  msg += `**Writing Style:** ${b.writingStyle}\n`
  msg += `**Content Pillars:** ${b.contentPillars.join(' · ')}\n`
  msg += `**Confidence:** ${s.brandConfidence}/10 (${s.scrapedPages.length} pages analyzed)\n\n`

  // Strategy if generated
  if (s.marketingStrategy) {
    const strat = s.marketingStrategy
    msg += `📋 **Marketing Strategy**\n${strat.summary}\n\n`
    msg += `**Primary Channel:** ${strat.primaryChannel}\n\n`
    msg += `**Quick Wins This Week:**\n`
    strat.quickWins.forEach((w, i) => { msg += `${i + 1}. ${w}\n` })
    msg += '\n'
  }

  // Generated Content
  if (s.generatedContent.length > 0) {
    msg += `✍️ **Generated Content**\n\n`
    s.generatedContent.forEach((piece, i) => {
      const platformLabel = piece.platform.charAt(0).toUpperCase() + piece.platform.slice(1)
      msg += `**${platformLabel} ${piece.type.charAt(0).toUpperCase() + piece.type.slice(1)} ${i + 1}:**\n`
      msg += `${piece.content}\n`
      if (piece.hashtags?.length) {
        msg += `\n${piece.hashtags.map(h => `#${h.replace('#', '')}`).join(' ')}\n`
      }
      msg += '\n---\n\n'
    })
  }

  return msg.trim()
}
