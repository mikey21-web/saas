import { StateGraph, START, END } from '@langchain/langgraph'
import { ContentMarketingAnnotation, ContentMarketingState } from './types'
import { ideaGeneratorAgent } from './agents/idea-generator'
import { copywriterAgent } from './agents/copywriter-agent'
import { optimizerAgent } from './agents/optimizer-agent'
import { aggregatorAgent } from './agents/aggregator-agent'
import { deliveryAgent } from './agents/delivery-agent'

const graph = new StateGraph(ContentMarketingAnnotation)
  .addNode('idea_generator', ideaGeneratorAgent)
  .addNode('copywriter', copywriterAgent)
  .addNode('optimizer', optimizerAgent)
  .addNode('aggregator', aggregatorAgent)
  .addNode('delivery', deliveryAgent)
  .addEdge(START, 'idea_generator')
  .addEdge('idea_generator', 'copywriter')
  .addEdge('copywriter', 'optimizer')
  .addEdge('optimizer', 'aggregator')
  .addEdge('aggregator', 'delivery')
  .addEdge('delivery', END)

const compiledGraph = graph.compile()

export async function runContentMarketing(input: {
  businessUpdate: string
  brandVoice: string
  pastPosts: string[]
}): Promise<{ state: ContentMarketingState; duration_ms: number }> {
  const start = Date.now()
  const result = await compiledGraph.invoke(
    {
      businessUpdate: input.businessUpdate,
      businessVoice: input.brandVoice,
      pastPosts: input.pastPosts,
      generatedIdeas: [],
      contentVariants: [],
      selectedVariants: [],
      publishedLinks: [],
      schedule: { posts: 0, platforms: 0, reach_estimate: 0 },
      analytics: {
        expected_reach: 0,
        best_time: '',
        estimated_leads: 0,
        content_calendar: [],
      },
      calendar_saved: false,
      analytics_sent: false,
      error: null,
    },
    { configurable: { thread_id: `content_${Date.now()}` } }
  )
  return { state: result as ContentMarketingState, duration_ms: Date.now() - start }
}

export { graph as contentMarketingGraph }
