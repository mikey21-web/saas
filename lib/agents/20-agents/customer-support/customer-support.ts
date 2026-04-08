import { StateGraph, END, START } from '@langchain/langgraph'
import { CustomerSupportAnnotation, type CustomerSupportState } from './types'
import { timeCheckAgent } from './agents/time-check-agent'
import { aiAgent } from './agents/ai-agent'
import { cleanAnswerAgent } from './agents/clean-answer-agent'
import { senderAgent } from './agents/sender-agent'

/**
 * Customer Support StateGraph
 *
 * Converted from n8n workflow:
 * "AI Customer-Support Assistant · WhatsApp Ready · Works for Any Business"
 *
 * n8n flow:
 * WhatsApp Trigger → AI Agent → 24-hour window check → IF(withinWindow)
 *   → YES: cleanAnswer → Send AI Answer
 *   → NO:  Send Template
 *
 * LangGraph flow:
 * START → ai_agent → time_check → clean_answer → sender → END
 */
const graph = new StateGraph(CustomerSupportAnnotation)

// Add nodes (one per n8n node)
graph.addNode('ai_agent', aiAgent)
graph.addNode('time_check', timeCheckAgent)
graph.addNode('clean_answer', cleanAnswerAgent)
graph.addNode('sender', senderAgent)

// Add edges (maps to n8n connections)
graph.addEdge(START, 'ai_agent')
graph.addEdge('ai_agent', 'time_check')
graph.addEdge('time_check', 'clean_answer')
graph.addEdge('clean_answer', 'sender')
graph.addEdge('sender', END)

export const customerSupportGraph = graph.compile()

/**
 * Run the customer support graph from a WhatsApp webhook trigger
 */
export async function runCustomerSupport(input: {
  userId: string
  phoneNumber: string
  userMessage: string
  messageTimestamp: number
  companyName: string
  websiteUrl: string
}): Promise<{ answer: string; sent: boolean }> {
  const result = await customerSupportGraph.invoke({
    ...input,
    withinWindow: false,
    conversationHistory: [],
    aiResponse: null,
    cleanedAnswer: '',
    sentSuccessfully: false,
  } as CustomerSupportState)

  return {
    answer: result.cleanedAnswer,
    sent: result.sentSuccessfully,
  }
}
