import { StateGraph, START, END } from '@langchain/langgraph'
import { SalesIntelligenceAnnotation, SalesIntelligenceState } from './types'
import { conversationAnalyzerAgent } from './agents/conversation-analyzer'
import { forecastAnalyzerAgent } from './agents/forecast-analyzer'
import { integrationAgent } from './agents/integration-agent'

const graph = new StateGraph(SalesIntelligenceAnnotation)
  .addNode('conversation_analyzer', conversationAnalyzerAgent)
  .addNode('forecast_analyzer', forecastAnalyzerAgent)
  .addNode('integration', integrationAgent)
  .addEdge(START, 'conversation_analyzer')
  .addEdge(START, 'forecast_analyzer')
  .addEdge('conversation_analyzer', 'integration')
  .addEdge('forecast_analyzer', 'integration')
  .addEdge('integration', END)

const compiledGraph = graph.compile()

export async function runSalesIntelligence(input: {
  userMessage: string
  contactName?: string
  contactPhone?: string
  messageContext?: string
}): Promise<{ state: SalesIntelligenceState; duration_ms: number }> {
  const start = Date.now()
  const result = await compiledGraph.invoke(
    {
      userMessage: input.userMessage,
      messageContext: input.messageContext || '',
      contactName: input.contactName || 'Unknown',
      contactPhone: input.contactPhone || '',
      // Conversation outputs
      intentScore: 0,
      urgency: '',
      stage: '',
      emotion: '',
      churnRisk: false,
      upsellOpportunity: false,
      suggestedReply: '',
      hinglishDetected: false,
      // Forecast outputs
      forecast90Day: 0,
      confidenceLevel: '',
      confidenceRange: { low: 0, high: 0 },
      cashflowGaps: [],
      topRisks: [],
      recommendedActions: [],
      // Integration outputs
      summary: '',
      alertTriggered: false,
      nextAction: '',
      alertsSent: false,
      error: null,
      // Competitor outputs (unused for now)
      competitorThreats: [],
    },
    { configurable: { thread_id: `sales_intel_${Date.now()}` } }
  )
  return { state: result as SalesIntelligenceState, duration_ms: Date.now() - start }
}

export { graph as salesIntelligenceGraph }
