import Anthropic from '@anthropic-ai/sdk'
import { SalesIntelligenceState } from '../types'

/**
 * Conversation Analyzer: Score intent, urgency, emotion, signals
 */
export async function conversationAnalyzerAgent(
  state: SalesIntelligenceState
): Promise<Partial<SalesIntelligenceState>> {
  try {
    const prompt = `You are an AI conversation analyst for Indian sales teams.

Analyze this customer message for intent, urgency, emotion, and signals:
Message: "${state.userMessage}"
Context: ${state.messageContext || 'No context'}

Respond with JSON:
{
  "intent_score": 1-10,
  "urgency": "immediate|this_week|this_month|browsing",
  "stage": "awareness|consideration|decision|negotiation|closed_won|at_risk",
  "emotion": "positive|neutral|frustrated|urgent|confused",
  "churn_risk": boolean,
  "upsell_opportunity": boolean,
  "suggested_reply": "brief response text",
  "hinglish_detected": boolean
}`

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      })

      if (groqRes.ok) {
        const data = await groqRes.json()
        const analysis = JSON.parse(data.choices?.[0]?.message?.content || '{}')
        return {
          intentScore: analysis.intent_score || 5,
          urgency: analysis.urgency || 'browsing',
          stage: analysis.stage || 'consideration',
          emotion: analysis.emotion || 'neutral',
          churnRisk: analysis.churn_risk || false,
          upsellOpportunity: analysis.upsell_opportunity || false,
          suggestedReply: analysis.suggested_reply || '',
          hinglishDetected: analysis.hinglish_detected || false,
        }
      }
    } catch {
      // Fallback to Claude
    }

    const client = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const analysis = JSON.parse(res.content[0].type === 'text' ? res.content[0].text : '{}')
    return {
      intentScore: analysis.intent_score || 5,
      urgency: analysis.urgency || 'browsing',
      stage: analysis.stage || 'consideration',
      emotion: analysis.emotion || 'neutral',
      churnRisk: analysis.churn_risk || false,
      upsellOpportunity: analysis.upsell_opportunity || false,
      suggestedReply: analysis.suggested_reply || '',
      hinglishDetected: analysis.hinglish_detected || false,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Conversation analysis failed: ${msg}` }
  }
}
