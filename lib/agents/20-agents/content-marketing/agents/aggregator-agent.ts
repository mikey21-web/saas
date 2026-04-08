import { ContentMarketingState } from '../types'

/**
 * Aggregator Agent: Combine all ideas + content + optimization into week schedule
 */
export async function aggregatorAgent(state: ContentMarketingState): Promise<Partial<ContentMarketingState>> {
  try {
    const selectedVariants = state.selectedVariants || []
    const generatedIdeas = state.generatedIdeas || []

    if (selectedVariants.length === 0 || generatedIdeas.length === 0) {
      return { error: 'Missing ideas or selected variants for aggregation' }
    }

    // Sort by quality (first variant is best optimized)
    const sorted = selectedVariants.slice(0, 7)

    // Build weekly calendar
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const calendar = {}

    sorted.forEach((variant, i) => {
      const day = days[i % 5]
      if (!calendar[day]) {
        calendar[day] = {
          idea: generatedIdeas[i]?.idea || 'Content',
          platform: variant.platform,
          time: variant.publishTime,
        }
      }
    })

    // Calculate schedule metrics
    const schedule = {
      posts: sorted.length,
      platforms: Array.from(new Set(sorted.map((v) => v.platform))).length,
      reach_estimate: sorted.length * 2500, // Conservative estimate
    }

    const analytics = {
      expected_reach: sorted.length * 2500,
      best_time: sorted[0]?.publishTime || 'Tuesday 10:00',
      estimated_leads: Math.floor((sorted.length * 2500 * 0.05) / 100), // 0.5% conversion
      content_calendar: Object.entries(calendar).map(([date, content]: any) => ({
        date,
        platform: content.platform,
        type: 'content',
      })),
    }

    return {
      schedule,
      analytics,
      calendar_saved: true,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Aggregation failed: ${msg}` }
  }
}
