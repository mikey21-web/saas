import { StateGraph, START, END } from '@langchain/langgraph'
import { RevenueForecastAnnotation, RevenueForecastState } from './types'
import { pipelineAgent } from './agents/pipeline-agent'
import { forecastAgent } from './agents/forecast-agent'
import { deliveryAgent } from './agents/delivery-agent'

const graph = new StateGraph(RevenueForecastAnnotation)
  .addNode('pipeline_agent', pipelineAgent)
  .addNode('forecast_agent', forecastAgent)
  .addNode('delivery_agent', deliveryAgent)
  .addEdge(START, 'pipeline_agent')
  .addEdge('pipeline_agent', 'forecast_agent')
  .addEdge('forecast_agent', 'delivery_agent')
  .addEdge('delivery_agent', END)

const compiledGraph = graph.compile()

export async function runRevenueForecast(): Promise<{ state: RevenueForecastState; duration_ms: number }> {
  const start = Date.now()
  const result = await compiledGraph.invoke(
    {
      activePipelineCount: 0, totalPipeline: 0, weightedForecast: 0,
      historicalWinRate: 0, avgDealValue: 0, avgSalesCycleDays: 0,
      momGrowthRate: 0, staleDeals: [], staleDealCount: 0,
      forecast90Day: 0, confidenceRange: { low: 0, high: 0 },
      confidenceLevel: 'medium', monthlyBreakdown: [], cashflowGaps: [],
      topRisks: [], topOpportunities: [], recommendedActions: [],
      forecastSummary: '', savedToDb: false, alertSent: false,
      emailSent: false, error: null,
    },
    { configurable: { thread_id: `forecast_${Date.now()}` } }
  )
  return { state: result as RevenueForecastState, duration_ms: Date.now() - start }
}

export { graph as revenueForecastGraph }
