import { StateGraph, START, END } from '@langchain/langgraph'
import { ConversationIntelAnnotation, ConversationIntelState } from './types'
import { contextAgent } from './agents/context-agent'
import { analyzerAgent } from './agents/analyzer-agent'
import { storageAlertAgent } from './agents/storage-alert-agent'

const graph = new StateGraph(ConversationIntelAnnotation)
  .addNode('context_agent', contextAgent)
  .addNode('analyzer_agent', analyzerAgent)
  .addNode('storage_alert_agent', storageAlertAgent)
  .addEdge(START, 'context_agent')
  .addEdge('context_agent', 'analyzer_agent')
  .addEdge('analyzer_agent', 'storage_alert_agent')
  .addEdge('storage_alert_agent', END)

const compiledGraph = graph.compile()

export async function runConversationIntel(input: {
  messageId: string
  from: string
  contactName: string
  text: string
  timestamp: string
}): Promise<{ state: ConversationIntelState; duration_ms: number }> {
  const start = Date.now()
  const result = await compiledGraph.invoke(
    {
      ...input,
      historyText: '', dealValue: null, isVip: false,
      conversationCount: 0, crmStage: 'unknown',
      intentScore: 5, urgency: 'this_month', stage: 'consideration',
      emotion: 'neutral', signals: [], upsellOpportunity: false,
      churnRisk: false, nextBestAction: '', suggestedReply: '',
      hinglishDetected: false, festivalContext: null, summary: '',
      shouldAlert: false, slackAlertSent: false, error: null,
    },
    { configurable: { thread_id: input.messageId } }
  )
  return { state: result as ConversationIntelState, duration_ms: Date.now() - start }
}

export { graph as conversationIntelGraph }
