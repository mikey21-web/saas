import { Annotation } from '@langchain/langgraph'

/**
 * E-commerce Operations Agent State
 * Handles: Shopify webhooks → classify event → route → execute handler
 * Categories: ORDER_NEW, ORDER_FULFILLED, REFUND, RETURN, INVENTORY_LOW, UNKNOWN
 */

export const EcommerceAnnotation = Annotation.Root({
  // Input
  webhookTopic: Annotation<string>,
  webhookPayload: Annotation<Record<string, unknown>>,
  eventId: Annotation<string>,
  receivedAt: Annotation<string>,

  // Classification (from Groq)
  category: Annotation<
    'ORDER_NEW' | 'ORDER_FULFILLED' | 'ORDER_CANCELLED' | 'REFUND_REQUESTED' | 'RETURN_REQUESTED' | 'INVENTORY_LOW' | 'UNKNOWN'
  >,
  confidence: Annotation<number>,

  // Extracted fields
  customerName: Annotation<string | null>,
  customerEmail: Annotation<string | null>,
  customerPhone: Annotation<string | null>,
  orderId: Annotation<string | null>,
  orderTotal: Annotation<string | null>,
  productName: Annotation<string | null>,
  sku: Annotation<string | null>,
  trackingNumber: Annotation<string | null>,
  carrier: Annotation<string | null>,
  refundAmount: Annotation<string | null>,
  returnReason: Annotation<string | null>,
  inventoryProduct: Annotation<string | null>,
  inventoryQuantity: Annotation<number | null>,

  // Execution flags
  needsHumanReview: Annotation<boolean>,
  escalationReason: Annotation<string | null>,
  actionSummary: Annotation<string>,

  // Output
  emailsSent: Annotation<string[]>,
  whatsappsSent: Annotation<string[]>,
  refundProcessed: Annotation<boolean>,
  error: Annotation<string | null>,
})

export type EcommerceState = typeof EcommerceAnnotation.State
