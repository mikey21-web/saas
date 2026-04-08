import { callAI } from '@/lib/ai/router'
import { AiCmoState, ContentPiece } from '../types'

/**
 * Content Generator Agent
 * Generates actual content pieces that sound exactly like the brand.
 * Uses brand profile to match tone, voice, writing style perfectly.
 */
export async function contentAgent(state: AiCmoState): Promise<Partial<AiCmoState>> {
  if (!state.brandProfile) {
    return {
      generatedContent: [],
      contentSummary: 'Could not generate content — brand analysis failed.',
    }
  }

  const b = state.brandProfile
  const strategy = state.marketingStrategy

  // Determine what to generate based on user request
  const requestLower = state.userRequest.toLowerCase()
  const wantsLinkedIn = requestLower.includes('linkedin') || requestLower.includes('post')
  const wantsTwitter = requestLower.includes('twitter') || requestLower.includes('tweet') || requestLower.includes('thread')
  const wantsEmail = requestLower.includes('email') || requestLower.includes('newsletter')
  const wantsStrategy = requestLower.includes('strategy') || requestLower.includes('plan') || requestLower.includes('calendar')

  // Default: generate LinkedIn + Twitter if nothing specific requested
  const generateLinkedIn = wantsLinkedIn || (!wantsTwitter && !wantsEmail && !wantsStrategy)
  const generateTwitter = wantsTwitter || (!wantsLinkedIn && !wantsEmail && !wantsStrategy)

  const prompt = `You are acting as the CMO for ${b.brandName}. Write content that sounds EXACTLY like them.

BRAND VOICE RULES — FOLLOW THESE STRICTLY:
- Tone: ${b.tone.join(', ')}
- Writing style: ${b.writingStyle}
- Target audience: ${b.targetAudience}
- Unique value prop: ${b.uniqueValueProp}
- Voice description: ${b.voice}
- Emotional triggers to use: ${b.emotionalTriggers?.join(', ')}
- Primary CTA: ${b.callToAction}

USER REQUEST: ${state.userRequest}

${strategy ? `CONTENT STRATEGY CONTEXT:\n${strategy.summary}\nTop pillar: ${b.contentPillars[0]}` : ''}

Generate the following content pieces. Each must sound like ${b.brandName} wrote it — not generic AI content.

Return a JSON array:
[
  {
    "platform": "linkedin",
    "type": "post",
    "content": "Full LinkedIn post (150-300 words). Hook in first line. No fluff. Ends with CTA.",
    "hashtags": ["3-5 relevant hashtags"],
    "cta": "Call to action line"
  },
  {
    "platform": "twitter",
    "type": "thread",
    "content": "Tweet 1/5: [hook]\\n\\nTweet 2/5: [point 1]\\n\\nTweet 3/5: [point 2]\\n\\nTweet 4/5: [point 3]\\n\\nTweet 5/5: [CTA]",
    "hashtags": ["2-3 hashtags"],
    "cta": "CTA for the thread"
  }
]

${generateLinkedIn && !generateTwitter ? 'Generate 2 LinkedIn posts.' : ''}
${generateTwitter && !generateLinkedIn ? 'Generate 1 Twitter thread (5 tweets).' : ''}
${generateLinkedIn && generateTwitter ? 'Generate 1 LinkedIn post and 1 Twitter thread.' : ''}
${wantsEmail ? 'Also generate 1 email newsletter.' : ''}

Return ONLY the JSON array.`

  try {
    const response = await callAI({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 1500,
    })

    const text = response.content.trim()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    const generatedContent = JSON.parse(jsonMatch[0]) as ContentPiece[]

    const contentSummary = `Generated ${generatedContent.length} content piece(s) for ${b.brandName} — written in ${b.tone.join(', ')} tone targeting ${b.targetAudience}.`

    return { generatedContent, contentSummary }
  } catch (err) {
    return {
      generatedContent: [],
      contentSummary: 'Content generation failed.',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
