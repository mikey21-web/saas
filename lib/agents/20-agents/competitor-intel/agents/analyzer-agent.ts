import { ChatGroq } from '@langchain/groq'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatAnthropic } from '@langchain/anthropic'
import { CompetitorIntelState, IntelligenceReport } from '../types'

/**
 * Analyzer Agent: Full competitive intelligence analysis
 * Uses Groq (primary) → Gemini → Claude fallback
 * Maps to n8n node: "Claude: Full Intelligence Analysis"
 */
export async function analyzerAgent(state: CompetitorIntelState): Promise<Partial<CompetitorIntelState>> {
  const competitor = state.currentCompetitor
  if (!competitor) return {}

  // Skip if nothing changed
  if (!state.anythingChanged) {
    return { report: null }
  }

  const prompt = `You are a competitive intelligence analyst.

Analyze the following data for competitor: ${competitor.name}
Website: ${competitor.website}
Run Time: ${state.runAt}

---
PRICING PAGE:
${(state.pricingText || '').substring(0, 2000)}

---
FEATURES PAGE:
${(state.featuresText || '').substring(0, 2000)}

---
BLOG / RSS FEED:
${(state.rssText || '').substring(0, 1500)}

---
ACTIVE ADS:
${(state.adsText || '').substring(0, 1000)}

---
CHANGES DETECTED:
- Pricing changed: ${state.pricingChanged}
- Features changed: ${state.featuresChanged}
- Content changed: ${state.contentChanged}
- Ads changed: ${state.adsChanged}

Respond ONLY in valid JSON (no markdown):
{
  "competitor_name": "${competitor.name}",
  "threat_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "threat_score": 7,
  "threat_reason": "...",
  "pricing": {
    "changed": true,
    "tiers": [{"name": "Starter", "price": "$29/mo", "features": ["..."]}],
    "key_change": "...",
    "strategic_signal": "...",
    "our_advantage": "..."
  },
  "features": {
    "changed": true,
    "new_features": ["..."],
    "removed_features": [],
    "key_change": "...",
    "strategic_signal": "...",
    "our_advantage": "..."
  },
  "content": {
    "changed": true,
    "latest_posts": [{"title": "...", "topic": "...", "date": "..."}],
    "content_themes": ["AI", "automation"],
    "strategic_signal": "..."
  },
  "ads": {
    "changed": true,
    "active_ad_count": 5,
    "ad_themes": ["Free trial"],
    "key_message": "...",
    "strategic_signal": "..."
  },
  "battle_card_summary": "2-3 sentence summary for sales team",
  "recommended_actions": ["Action 1", "Action 2", "Action 3"]
}`

  let response = ''

  // Tier 1: Groq
  try {
    const groq = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'mixtral-8x7b-32768',
      temperature: 0.2,
      maxTokens: 1500,
    })
    const result = await groq.invoke([{ role: 'user', content: prompt }])
    response = result.content as string
  } catch {
    // Tier 2: Gemini
    try {
      const gemini = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: 'gemini-2.0-flash',
        temperature: 0.2,
        maxOutputTokens: 1500,
      })
      const result = await gemini.invoke([{ role: 'user', content: prompt }])
      response = result.content as string
    } catch {
      // Tier 3: Claude
      const claude = new ChatAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-opus-4-6',
        temperature: 0.2,
        maxTokens: 1500,
      })
      const result = await claude.invoke([{ role: 'user', content: prompt }])
      response = result.content as string
    }
  }

  // Parse
  try {
    const clean = response.replace(/```json|```/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    const report = JSON.parse(match ? match[0] : clean) as IntelligenceReport

    return {
      report,
      reports: [report],
    }
  } catch (e) {
    const fallback: IntelligenceReport = {
      competitor_name: competitor.name,
      threat_level: 'UNKNOWN',
      threat_score: 0,
      threat_reason: `Parse error: ${e instanceof Error ? e.message : 'Unknown'}`,
      pricing: { changed: false, tiers: [], key_change: 'Parse error', strategic_signal: '', our_advantage: '' },
      features: { changed: false, new_features: [], removed_features: [], key_change: 'Parse error', strategic_signal: '', our_advantage: '' },
      content: { changed: false, latest_posts: [], content_themes: [], strategic_signal: '' },
      ads: { changed: false, active_ad_count: 0, ad_themes: [], key_message: '', strategic_signal: '' },
      battle_card_summary: 'Analysis failed — manual review needed',
      recommended_actions: ['Review competitor manually'],
    }
    return { report: fallback, reports: [fallback] }
  }
}
