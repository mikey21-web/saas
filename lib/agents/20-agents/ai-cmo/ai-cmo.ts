import { StateGraph, START, END } from '@langchain/langgraph'
import { AiCmoAnnotation, AiCmoState } from './types'
import { scraperAgent } from './agents/scraper-agent'
import { brandAnalyzerAgent } from './agents/brand-analyzer-agent'
import { strategyAgent } from './agents/strategy-agent'
import { contentAgent } from './agents/content-agent'

const graph = new StateGraph(AiCmoAnnotation)
  .addNode('scraper', scraperAgent)
  .addNode('brand_analyzer', brandAnalyzerAgent)
  .addNode('strategy', strategyAgent)
  .addNode('content', contentAgent)
  .addEdge(START, 'scraper')
  .addEdge('scraper', 'brand_analyzer')
  .addEdge('brand_analyzer', 'strategy')
  .addEdge('strategy', 'content')
  .addEdge('content', END)

const compiledGraph = graph.compile()

export async function runAiCmo(input: {
  websiteUrl: string
  userRequest: string
  agentId: string
}): Promise<{ state: AiCmoState; duration_ms: number }> {
  const start = Date.now()

  const result = await compiledGraph.invoke(
    {
      websiteUrl: input.websiteUrl,
      userRequest: input.userRequest,
      agentId: input.agentId,
      scrapedContent: '',
      scrapedPages: [],
      scrapeError: null,
      brandProfile: null,
      brandConfidence: 0,
      marketingStrategy: null,
      generatedContent: [],
      contentSummary: '',
      summary: '',
      error: null,
    },
    { configurable: { thread_id: `ai_cmo_${Date.now()}` } }
  )

  return { state: result as AiCmoState, duration_ms: Date.now() - start }
}

export { graph as aiCmoGraph }
