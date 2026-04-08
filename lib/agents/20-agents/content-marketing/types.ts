import { Annotation } from '@langchain/langgraph'

export const ContentMarketingAnnotation = Annotation.Root({
  // Input
  businessUpdate: Annotation<string>,
  pastPosts: Annotation<string[]>,
  brandVoice: Annotation<string>,

  // Idea Generation
  generatedIdeas: Annotation<Array<{ idea: string; platform: string }>>,

  // Copy Generation
  contentVariants: Annotation<
    Array<{
      idea: string
      platform: 'linkedin' | 'twitter' | 'instagram' | 'whatsapp' | 'email'
      content: string
      cta: string
    }>
  >,

  // Optimization
  selectedVariants: Annotation<
    Array<{
      platform: string
      content: string
      publishTime: string
      hashtags: string[]
    }>
  >,

  // Publishing
  publishedLinks: Annotation<
    Array<{
      platform: string
      postId: string
      url: string
      timestamp: string
    }>
  >,

  // Analytics
  schedule: Annotation<{ posts: number; platforms: number; reach_estimate: number }>,
  analytics: Annotation<{
    expected_reach: number
    best_time: string
    estimated_leads: number
    content_calendar: Array<{ date: string; platform: string; type: string }>
  }>,

  // Metadata
  calendar_saved: Annotation<boolean>,
  analytics_sent: Annotation<boolean>,
  error: Annotation<string | null>,
})

export type ContentMarketingState = typeof ContentMarketingAnnotation.State
