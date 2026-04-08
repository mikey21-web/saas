import Anthropic from '@anthropic-ai/sdk'
import { ContentMarketingState } from '../types'

/**
 * Copywriter Agent: Idea → Platform-specific copy (LinkedIn, Twitter, Instagram, WhatsApp, Email)
 */
export async function copywriterAgent(state: ContentMarketingState): Promise<Partial<ContentMarketingState>> {
  try {
    if (!state.generatedIdeas || state.generatedIdeas.length === 0) {
      return { error: 'No ideas to copywrite' }
    }

    const idea = state.generatedIdeas[0]

    const prompt = `You are an elite multichannel copywriter for Indian brands. Write platform-native copy for each channel.

Brand: ${state.businessVoice || 'Professional yet conversational'}
Business Update: ${state.businessUpdate}
Idea: ${idea.idea}
Platform: ${idea.platform}

Brand voice from past posts: ${state.pastPosts?.slice(0, 2).join(' | ') || 'None provided'}

Generate platform-specific copy matching exact requirements:

LINKEDIN: 700-900 words, scroll-stopping first line (never "I am excited"), strategic line breaks, data-driven, engaging closing question.
TWITTER: Exactly 7 tweets, tweet 1 is mega-hook, tweets 2-6 standalone insights, tweet 7 is summary+CTA.
INSTAGRAM: 5 slides with headlines + body copy, full caption 150-200 words with emojis, 15-20 hashtags.
WHATSAPP: 3 versions (50w, 100w, 150w), Hinglish where natural, max 1 emoji/para, peer-to-peer tone, CTA with [LINK].
EMAIL: 5 subject line options, preview text, 400-500 word body with {{subscriber_first_name}}, strong P.S.

Return ONLY JSON:
{
  "linkedin": { "post": "full post with \\\\n breaks", "hashtags": ["#tag1"], "cta_question": "question" },
  "twitter": { "tweets": [{ "number": 1, "content": "text", "hashtags": ["#tag"] }] },
  "instagram": { "slides": [{ "number": 1, "headline": "text", "body": "text", "alt_text": "accessibility" }], "caption": "full caption", "hashtags": ["#tag1"] },
  "whatsapp": { "short": "50w", "medium": "100w", "long": "150w" },
  "email": { "subject_lines": [{ "option": 1, "subject": "text", "preview_text": "text", "angle": "curiosity" }], "body": "full body", "cta_text": "CTA", "ps_line": "P.S." }
}`

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
          max_tokens: 4000,
        }),
      })

      if (groqRes.ok) {
        const data = await groqRes.json()
        const variants = JSON.parse(data.choices?.[0]?.message?.content || '{}')
        return {
          contentVariants: [
            {
              idea: idea.idea,
              platform: (idea.platform as any) || 'linkedin',
              content: variants.linkedin?.post || variants.email?.body || 'Content generated',
              cta: variants.linkedin?.cta_question || variants.email?.cta_text || 'Learn more',
            },
          ],
        }
      }
    } catch {
      // Fallback
    }

    // Fallback to Claude
    const client = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const variants = JSON.parse(res.content[0].type === 'text' ? res.content[0].text : '{}')
    return {
      contentVariants: [
        {
          idea: idea.idea,
          platform: (idea.platform as any) || 'linkedin',
          content: variants.linkedin?.post || variants.email?.body || 'Content generated',
          cta: variants.linkedin?.cta_question || variants.email?.cta_text || 'Learn more',
        },
      ],
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Copywriter failed: ${msg}` }
  }
}
