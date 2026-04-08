import { StateGraph, START, END } from '@langchain/langgraph'
import { CompetitorIntelAnnotation, CompetitorIntelState, Competitor, IntelligenceReport } from './types'
import { scraperAgent } from './agents/scraper-agent'
import { hashCheckAgent } from './agents/hash-check-agent'
import { analyzerAgent } from './agents/analyzer-agent'
import { storageAgent } from './agents/storage-agent'

/**
 * Competitor Intelligence StateGraph
 * Flow: START → scraper → hash_check → analyzer (if changed) → storage → END
 */
const competitorIntelGraph = new StateGraph(CompetitorIntelAnnotation)
  .addNode('scraper_agent', scraperAgent)
  .addNode('hash_check_agent', hashCheckAgent)
  .addNode('analyzer_agent', analyzerAgent)
  .addNode('storage_agent', storageAgent)

  .addEdge(START, 'scraper_agent')
  .addEdge('scraper_agent', 'hash_check_agent')
  .addConditionalEdges('hash_check_agent', (state: CompetitorIntelState) => {
    return state.anythingChanged ? 'analyzer_agent' : 'end_no_changes'
  }, {
    analyzer_agent: 'analyzer_agent',
    end_no_changes: END,
  })
  .addEdge('analyzer_agent', 'storage_agent')
  .addEdge('storage_agent', END)

const compiledGraph = competitorIntelGraph.compile()

/**
 * Run Competitor Intelligence for a list of competitors
 * Processes each competitor sequentially, returns all reports
 */
export async function runCompetitorIntelWorkflow(input: {
  agentId: string
  userId: string
  competitors: Competitor[]
}): Promise<{
  reports: IntelligenceReport[]
  competitors_checked: number
  changes_detected: number
  high_threats: number
  duration_ms: number
}> {
  const startTime = Date.now()
  const allReports: IntelligenceReport[] = []
  const runId = `run_${Date.now()}`
  const runAt = new Date().toISOString()

  // Process each competitor one by one
  for (const competitor of input.competitors) {
    try {
      const result = await compiledGraph.invoke(
        {
          agentId: input.agentId,
          userId: input.userId,
          competitors: input.competitors,
          runId,
          runAt,
          currentCompetitor: competitor,
          pricingText: '',
          featuresText: '',
          rssText: '',
          adsText: '',
          pricingChanged: false,
          featuresChanged: false,
          contentChanged: false,
          adsChanged: false,
          anythingChanged: false,
          report: null,
          reports: [],
          alertsSent: [],
          error: null,
        },
        { configurable: { thread_id: `${runId}_${competitor.name}` } }
      )

      if (result.report) {
        allReports.push(result.report)
      }
    } catch (err) {
      console.error(`[CompetitorIntel] Error processing ${competitor.name}:`, err)
    }
  }

  const highThreats = allReports.filter(r => r.threat_score >= 7).length
  const changesDetected = allReports.filter(r =>
    r.pricing?.changed || r.features?.changed || r.content?.changed || r.ads?.changed
  ).length

  return {
    reports: allReports,
    competitors_checked: input.competitors.length,
    changes_detected: changesDetected,
    high_threats: highThreats,
    duration_ms: Date.now() - startTime,
  }
}

export { competitorIntelGraph, compiledGraph }
