import { StateGraph, START, END } from '@langchain/langgraph'
import { DecisionCopilotAnnotation, DecisionCopilotState } from './types'
import { analyzerAgent } from './agents/analyzer-agent'
import { prioritizerAgent } from './agents/prioritizer-agent'
import { communicatorAgent } from './agents/communicator-agent'

const graph = new StateGraph(DecisionCopilotAnnotation)
  .addNode('analyzer', analyzerAgent)
  .addNode('prioritizer', prioritizerAgent)
  .addNode('communicator', communicatorAgent)
  .addEdge(START, 'analyzer')
  .addEdge('analyzer', 'prioritizer')
  .addEdge('prioritizer', 'communicator')
  .addEdge('communicator', END)

const compiledGraph = graph.compile()

export async function runDecisionCopilot(input: {
  businessName: string
  businessMetrics: Record<string, unknown>
  recentEvents: string
  userRole: string
  decisionContext: string
}): Promise<{ state: DecisionCopilotState; duration_ms: number }> {
  const start = Date.now()
  const result = await compiledGraph.invoke(
    {
      businessName: input.businessName,
      businessMetrics: input.businessMetrics,
      recentEvents: input.recentEvents,
      userRole: input.userRole,
      decisionContext: input.decisionContext,
      // Analyzer outputs
      topChallenges: [],
      opportunities: [],
      risks: [],
      dataInsights: {},
      // Prioritizer outputs
      topThreeActions: [],
      prioritizationMethod: '',
      urgencyScore: 0,
      // Communicator outputs
      dailyBrief: '',
      actionItems: [],
      executiveSummary: '',
      deliveryChannel: 'email',
      // Summary
      summary: '',
      error: null,
    },
    { configurable: { thread_id: `decision_copilot_${Date.now()}` } }
  )
  return { state: result as DecisionCopilotState, duration_ms: Date.now() - start }
}

export { graph as decisionCopilotGraph }
