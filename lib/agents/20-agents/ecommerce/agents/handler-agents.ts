import { RunnableConfig } from '@langchain/core/runnables'
import {
  sendOrderConfirmationEmail,
  sendOrderConfirmationWhatsApp,
  sendOrderShippedEmail,
  sendOrderShippedWhatsApp,
  sendOrderCancelledEmail,
  sendOrderCancelledWhatsApp,
  sendRefundInitiatedEmail,
  sendRefundInitiatedWhatsApp,
  processShopifyRefund,
  logEventToSupabase,
} from '../integrations'
import { EcommerceState } from '../types'

/**
 * ORDER_NEW Handler: Send confirmation email + WhatsApp
 */
export async function orderNewHandler(state: EcommerceState, config?: RunnableConfig): Promise<Partial<EcommerceState>> {
  const emailsSent: string[] = []
  const whatsappsSent: string[] = []

  try {
    await sendOrderConfirmationEmail(state)
    if (state.customerEmail) emailsSent.push(state.customerEmail)
  } catch (error) {
    console.error('[Ecommerce] Order confirmation email failed:', error)
  }

  try {
    await sendOrderConfirmationWhatsApp(state)
    if (state.customerPhone) whatsappsSent.push(state.customerPhone)
  } catch (error) {
    console.error('[Ecommerce] Order confirmation WhatsApp failed:', error)
  }

  await logEventToSupabase(state)

  return { emailsSent, whatsappsSent }
}

/**
 * ORDER_FULFILLED Handler: Send tracking info email + WhatsApp
 */
export async function orderFulfilledHandler(state: EcommerceState, config?: RunnableConfig): Promise<Partial<EcommerceState>> {
  const emailsSent: string[] = []
  const whatsappsSent: string[] = []

  try {
    await sendOrderShippedEmail(state)
    if (state.customerEmail) emailsSent.push(state.customerEmail)
  } catch (error) {
    console.error('[Ecommerce] Shipped email failed:', error)
  }

  try {
    await sendOrderShippedWhatsApp(state)
    if (state.customerPhone) whatsappsSent.push(state.customerPhone)
  } catch (error) {
    console.error('[Ecommerce] Shipped WhatsApp failed:', error)
  }

  await logEventToSupabase(state)

  return { emailsSent, whatsappsSent }
}

/**
 * ORDER_CANCELLED Handler: Send cancellation notification + refund if needed
 */
export async function orderCancelledHandler(state: EcommerceState, config?: RunnableConfig): Promise<Partial<EcommerceState>> {
  const emailsSent: string[] = []
  const whatsappsSent: string[] = []
  let refundProcessed = false

  try {
    await sendOrderCancelledEmail(state)
    if (state.customerEmail) emailsSent.push(state.customerEmail)
  } catch (error) {
    console.error('[Ecommerce] Cancellation email failed:', error)
  }

  try {
    await sendOrderCancelledWhatsApp(state)
    if (state.customerPhone) whatsappsSent.push(state.customerPhone)
  } catch (error) {
    console.error('[Ecommerce] Cancellation WhatsApp failed:', error)
  }

  await logEventToSupabase(state)

  return { emailsSent, whatsappsSent, refundProcessed }
}

/**
 * REFUND_REQUESTED Handler: Process Shopify refund + send confirmation
 */
export async function refundRequestedHandler(state: EcommerceState, config?: RunnableConfig): Promise<Partial<EcommerceState>> {
  const emailsSent: string[] = []
  const whatsappsSent: string[] = []
  let refundProcessed = false
  let error: string | null = null

  try {
    refundProcessed = await processShopifyRefund(state)
  } catch (err) {
    console.error('[Ecommerce] Shopify refund failed:', err)
    error = err instanceof Error ? err.message : 'Refund processing failed'
  }

  try {
    await sendRefundInitiatedEmail(state)
    if (state.customerEmail) emailsSent.push(state.customerEmail)
  } catch (err) {
    console.error('[Ecommerce] Refund email failed:', err)
  }

  try {
    await sendRefundInitiatedWhatsApp(state)
    if (state.customerPhone) whatsappsSent.push(state.customerPhone)
  } catch (err) {
    console.error('[Ecommerce] Refund WhatsApp failed:', err)
  }

  await logEventToSupabase(state)

  return { emailsSent, whatsappsSent, refundProcessed, error }
}

/**
 * RETURN_REQUESTED Handler: Log return request for manual handling
 */
export async function returnRequestedHandler(state: EcommerceState, config?: RunnableConfig): Promise<Partial<EcommerceState>> {
  console.log('[Ecommerce] Return requested — escalating to support', {
    orderId: state.orderId,
    reason: state.returnReason,
  })

  await logEventToSupabase(state)

  return {
    needsHumanReview: true,
    escalationReason: `Return requested for order ${state.orderId}: ${state.returnReason}`,
  }
}

/**
 * INVENTORY_LOW Handler: Alert ops team
 */
export async function inventoryLowHandler(state: EcommerceState, config?: RunnableConfig): Promise<Partial<EcommerceState>> {
  console.log('[Ecommerce] Low inventory alert', {
    product: state.inventoryProduct,
    quantity: state.inventoryQuantity,
  })

  await logEventToSupabase(state)

  return {
    needsHumanReview: true,
    escalationReason: `Low inventory: ${state.inventoryProduct} (${state.inventoryQuantity} units remaining)`,
  }
}

/**
 * UNKNOWN Handler: Escalate for manual review
 */
export async function unknownHandler(state: EcommerceState, config?: RunnableConfig): Promise<Partial<EcommerceState>> {
  console.log('[Ecommerce] Unknown event type — escalating', { topic: state.webhookTopic })

  await logEventToSupabase(state)

  return {
    needsHumanReview: true,
    escalationReason: `Could not classify webhook topic: ${state.webhookTopic}`,
    actionSummary: 'Unknown event — requires manual investigation',
  }
}
