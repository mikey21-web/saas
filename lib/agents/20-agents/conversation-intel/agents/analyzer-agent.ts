import { ChatGroq } from '@langchain/groq'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ConversationIntelState } from '../types'

/**
 * Analyzer Agent: B2B sales conversation analysis
 * Detects intent score, urgency, stage, emotion, churn risk, upsell signals
 * Groq (primary) → Gemini → Claude fallback
 * Maps to n8n: ConversationIntel AI node
 */
export async function analyzerAgent(state: ConversationIntelState): Promise<Partial<ConversationIntelState>> {
  const systemPrompt = `You are an expert B2B sales conversation analyst specializing in Indian markets and Hinglish communication. Analyze the conversation and return ONLY valid JSON (no markdown):
{
  "intentScore": <1-10>,
  "urgency": "immediate" | "this_week" | "this_month" | "browsing",
  "stage": "awareness" | "consideration" | "decision" | "negotiation" | "closed_won" | "at_risk",
  "emotion": "positive" | "neutral" | "frustrated" | "urgent" | "confused",
  "signals": ["<signal1>", "<signal2>"],
  "upsellOpportunity": <boolean>,
  "churnRisk": <boolean>,
  "nextBestAction": "<one specific action>",
  "suggestedReply": "<personalized reply in the same language/style as the customer>",
  "hinglishDetected": <boolean>,
  "festivalContext": "<festival name if relevant, else null>",
  "summary": "<2 sentence summary>"
}`

  const userPrompt = `Analyze this WhatsApp conversation:

Contact: ${state.contactName} (${state.isVip ? `VIP - Deal value: ₹${state.dealValue}` : 'Standard'})
Conversation count: ${state.conversationCount}
CRM stage: ${state.crmStage}
Deal value: ₹${state.dealValue || 'unknown'}

Conversation history:
${state.historyText}

Latest message:
${state.text}`

  let response = ''

  try {
    const groq = new ChatGroq({ apiKey: process.env.GROQ_API_KEY, model: 'mixtral-8x7b-32768', temperature: 0.1, maxTokens: 800 })
    const result = await groq.invoke([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }])
    response = result.content as string
  } catch {
    try {
      const gemini = new ChatGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY, model: 'gemini-2.0-flash', temperature: 0.1, maxOutputTokens: 800 })
      const result = await gemini.invoke([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }])
      response = result.content as string
    } catch {
      const claude = new ChatAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-opus-4-6', temperature: 0.1, maxTokens: 800 })
      const result = await claude.invoke([{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }])
      response = result.content as string
    }
  }

  try {
    const clean = response.replace(/```json|```/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    const intel = JSON.parse(match ? match[0] : clean)

    const shouldAlert = intel.intentScore >= 8 || (state.isVip && intel.emotion === 'frustrated') || intel.churnRisk === true

    return {
      intentScore: intel.intentScore || 5,
      urgency: intel.urgency || 'this_month',
      stage: intel.stage || 'consideration',
      emotion: intel.emotion || 'neutral',
      signals: intel.signals || [],
      upsellOpportunity: intel.upsellOpportunity || false,
      churnRisk: intel.churnRisk || false,
      nextBestAction: intel.nextBestAction || 'Follow up',
      suggestedReply: intel.suggestedReply || '',
      hinglishDetected: intel.hinglishDetected || false,
      festivalContext: intel.festivalContext || null,
      summary: intel.summary || '',
      shouldAlert,
    }
  } catch (e) {
    return {
      intentScore: 5, urgency: 'this_month', stage: 'consideration', emotion: 'neutral',
      signals: [], upsellOpportunity: false, churnRisk: false,
      nextBestAction: 'Follow up manually', suggestedReply: '', hinglishDetected: false,
      festivalContext: null, summary: 'Analysis failed', shouldAlert: false,
      error: `Parse error: ${e instanceof Error ? e.message : 'Unknown'}`,
    }
  }
}
