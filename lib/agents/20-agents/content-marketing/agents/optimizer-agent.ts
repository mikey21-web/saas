import Anthropic from '@anthropic-ai/sdk'
import { ContentMarketingState } from '../types'

/**
 * Optimizer Agent: Score content, recommend best platform, optimal posting times
 */
export async function optimizerAgent(state: ContentMarketingState): Promise<Partial<ContentMarketingState>> {
  try {
    if (!state.contentVariants || state.contentVariants.length === 0) {
      return { error: 'No content to optimize' }
    }

    const variant = state.contentVariants[0]
    const prompt = `You are a data-driven Indian social media strategist. Score this content ruthlessly.

Platform: ${variant.platform}
Content Snippet: ${variant.content?.slice(0, 200) || 'N/A'}
CTA: ${variant.cta}

Indian audience sophistication is HIGH — founders, entrepreneurs, professionals. Score 1-10 where:
- 10 = genuinely viral in Indian startup circles
- 5 = average engagement
- 1 = tone-deaf or generic

Return ONLY JSON:
{
  "overall_score": 8.4,
  "publish_recommended": true,
  "hook_strength": "strong",
  "best_platform": "${variant.platform}",
  "improvements": ["improvement 1"],
  "optimal_post_time_ist": "Tuesday 08:30",
  "predicted_reach": "2000-4500",
  "predicted_engagement_rate": "4.2%",
  "ab_variant": "alternative opening for A/B test"
}`

    // Try Groq
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
          temperature: 0.2,
          max_tokens: 1500,
        }),
      })

      if (groqRes.ok) {
        const data = await groqRes.json()
        const opt = JSON.parse(data.choices?.[0]?.message?.content || '{}')
        return {
          selectedVariants: [
            {
              platform: variant.platform,
              content: variant.content,
              publishTime: opt.optimal_post_time_ist || 'Tuesday 10:00',
              hashtags: ['#startup', '#india'],
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
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const opt = JSON.parse(res.content[0].type === 'text' ? res.content[0].text : '{}')
    return {
      selectedVariants: [
        {
          platform: variant.platform,
          content: variant.content,
          publishTime: opt.optimal_post_time_ist || 'Tuesday 10:00',
          hashtags: ['#startup', '#india'],
        },
      ],
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Optimizer failed: ${msg}` }
  }
}
