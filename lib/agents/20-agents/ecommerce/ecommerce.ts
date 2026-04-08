import { StateGraph, START, END } from '@langchain/langgraph'
import { EcommerceAnnotation, EcommerceState } from './types'
import { classifierAgent } from './agents/classifier-agent'
import {
  orderNewHandler,
  orderFulfilledHandler,
  orderCancelledHandler,
  refundRequestedHandler,
  returnRequestedHandler,
  inventoryLowHandler,
  unknownHandler,
} from './agents/handler-agents'

/**
 * E-commerce Operations StateGraph
 * Flow: START → classifier_agent → route by category → handler agents → END
 */

const ecommerceGraph = new StateGraph(EcommerceAnnotation)
  .addNode('classifier_agent', classifierAgent)
  .addNode('order_new_handler', orderNewHandler)
  .addNode('order_fulfilled_handler', orderFulfilledHandler)
  .addNode('order_cancelled_handler', orderCancelledHandler)
  .addNode('refund_handler', refundRequestedHandler)
  .addNode('return_handler', returnRequestedHandler)
  .addNode('inventory_handler', inventoryLowHandler)
  .addNode('unknown_handler', unknownHandler)

  // Edges
  .addEdge(START, 'classifier_agent')
  .addConditionalEdges('classifier_agent', (state: EcommerceState) => {
    return state.category || 'UNKNOWN'
  })
  .addEdge('order_new_handler', END)
  .addEdge('order_fulfilled_handler', END)
  .addEdge('order_cancelled_handler', END)
  .addEdge('refund_handler', END)
  .addEdge('return_handler', END)
  .addEdge('inventory_handler', END)
  .addEdge('unknown_handler', END)

// Compile the graph
const compiledGraph = ecommerceGraph.compile()

/**
 * Run E-commerce Workflow
 * Input: Shopify webhook data
 * Output: Classification + handler results
 */
export async function runEcommerceWorkflow(input: {
  webhookTopic: string
  webhookPayload: Record<string, unknown>
  eventId: string
  receivedAt: string
}): Promise<{
  state: EcommerceState
  duration_ms: number
}> {
  const startTime = Date.now()

  const result = await compiledGraph.invoke(
    {
      webhookTopic: input.webhookTopic,
      webhookPayload: input.webhookPayload,
      eventId: input.eventId,
      receivedAt: input.receivedAt,
      // Initialize other fields
      category: 'UNKNOWN',
      confidence: 0,
      customerName: null,
      customerEmail: null,
      customerPhone: null,
      orderId: null,
      orderTotal: null,
      productName: null,
      sku: null,
      trackingNumber: null,
      carrier: null,
      refundAmount: null,
      returnReason: null,
      inventoryProduct: null,
      inventoryQuantity: null,
      needsHumanReview: false,
      escalationReason: null,
      actionSummary: '',
      emailsSent: [],
      whatsappsSent: [],
      refundProcessed: false,
      error: null,
    },
    { configurable: { thread_id: input.eventId } }
  )

  const duration_ms = Date.now() - startTime

  return {
    state: result as EcommerceState,
    duration_ms,
  }
}

export { ecommerceGraph, compiledGraph }
export type { EcommerceState }
