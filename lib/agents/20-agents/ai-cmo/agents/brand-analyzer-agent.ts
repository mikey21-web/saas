import { callAI } from '@/lib/ai/router'
import { AiCmoState, BrandProfile } from '../types'

/**
 * Brand Analyzer Agent
 * Reads scraped website content and extracts the full brand identity:
 * tone, voice, audience, key messages, content pillars, writing style
 */
export async function brandAnalyzerAgent(state: AiCmoState): Promise<Partial<AiCmoState>> {
  if (state.scrapeError || !state.scrapedContent) {
    return {
      brandProfile: null,
      brandConfidence: 0,
      error: state.scrapeError || 'No content to analyze',
    }
  }

  const prompt = `You are an expert brand strategist and CMO. Analyze the following website content and extract the complete brand identity.

WEBSITE CONTENT:
${state.scrapedContent}

Extract and return a JSON object with this exact structure:
{
  "brandName": "Company name",
  "industry": "What industry/niche they are in",
  "tone": ["3-5 tone words like bold, direct, warm, professional, playful"],
  "voice": "2-3 sentence description of how they communicate. What makes their writing unique.",
  "targetAudience": "Who they're talking to — be specific (e.g. 'B2B SaaS founders with 10-100 person teams')",
  "keyMessages": ["3-5 core messages they keep repeating across the site"],
  "contentPillars": ["4-5 topics they could own — based on what they actually talk about"],
  "uniqueValueProp": "Their main differentiator in one clear sentence",
  "competitors": ["Infer 2-3 likely competitors based on their positioning"],
  "colorVibe": "Describe the visual/design vibe based on the language they use (e.g. 'clean, minimal, corporate' or 'bold, high-energy, startup')",
  "writingStyle": "How they write — sentence length, vocabulary, use of data, emotional vs logical",
  "emotionalTriggers": ["2-3 emotional triggers they use — e.g. aspiration, fear of missing out, trust, social proof"],
  "callToAction": "Their primary CTA — what do they want visitors to do"
}

Return ONLY the JSON. No markdown, no explanation.`

  try {
    const response = await callAI({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 1000,
    })

    const text = response.content.trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const brandProfile = JSON.parse(jsonMatch[0]) as BrandProfile

    // Confidence based on how much content we got
    const confidence = Math.min(10, Math.floor(state.scrapedPages.length * 2.5))

    return {
      brandProfile,
      brandConfidence: confidence,
      error: null,
    }
  } catch (err) {
    return {
      brandProfile: null,
      brandConfidence: 0,
      error: err instanceof Error ? err.message : 'Brand analysis failed',
    }
  }
}
