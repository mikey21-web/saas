import Anthropic from '@anthropic-ai/sdk'
import { ContentMarketingState } from '../types'

/**
 * Idea Generator: Business update → 7 content ideas
 */
export async function ideaGeneratorAgent(state: ContentMarketingState): Promise<Partial<ContentMarketingState>> {
  try {
    const prompt = `You are a content strategist for Indian SMBs.
Given this business update: "${state.businessUpdate}"

Generate 7 diverse content ideas that work across LinkedIn, Twitter, Instagram, WhatsApp, and Email.
Each idea should:
- Be specific and actionable
- Target Indian audiences
- Include trending topics/festivals context
- Work across multiple formats

Return JSON array with objects: { idea: string, platform: string }
Platform options: "linkedin", "twitter", "instagram", "whatsapp", "email"

Respond only with JSON array, no markdown.`

    // Try Groq first
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
          temperature: 0.7,
        }),
      })

      if (groqRes.ok) {
        const data = await groqRes.json()
        const ideas = JSON.parse(data.choices?.[0]?.message?.content || '[]')
        return { generatedIdeas: ideas }
      }
    } catch {
      // Fallback to Gemini
    }

    // Fallback to Gemini
    try {
      const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY || '' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 },
        }),
      })

      if (geminiRes.ok) {
        const data = await geminiRes.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
        const ideas = JSON.parse(content)
        return { generatedIdeas: ideas }
      }
    } catch {
      // Fallback to Claude
    }

    // Fallback to Claude
    const client = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const ideas = JSON.parse(res.content[0].type === 'text' ? res.content[0].text : '[]')
    return { generatedIdeas: ideas }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Idea generation failed: ${msg}` }
  }
}
