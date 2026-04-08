import { runEcommerceWorkflow } from '@/lib/agents/20-agents/ecommerce'
import { supabaseAdmin } from '@/lib/supabase/client'

export interface EcommerceContext {
  agentId: string
  userId: string
  channel?: string
  webhookTopic: string
  webhookPayload: Record<string, unknown>
  eventId: string
}

/**
 * Executor for E-commerce Operations Agent
 * Shopify webhook → classify → route → execute handlers
 *
 * Accepts:
 * - Shopify webhooks: order.created, order.fulfilled, refund.created, inventory.levels.update, etc.
 * - Classifies event → routes to appropriate handler (email, WhatsApp, refund processing, etc.)
 */
export async function executeEcommerce(
  ctx: EcommerceContext
): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
  try {
    const result = await runEcommerceWorkflow({
      webhookTopic: ctx.webhookTopic,
      webhookPayload: ctx.webhookPayload,
      eventId: ctx.eventId,
      receivedAt: new Date().toISOString(),
    })

    const state = result.state
    const responseMessage = buildResponseMessage(state)

    await storeConversation(ctx, responseMessage, state)

    return {
      success: true,
      message: responseMessage,
      data: {
        category: state.category,
        confidence: state.confidence,
        emails_sent: state.emailsSent?.length || 0,
        whatsapps_sent: state.whatsappsSent?.length || 0,
        refund_processed: state.refundProcessed,
        needs_review: state.needsHumanReview,
        escalation_reason: state.escalationReason,
        duration_ms: result.duration_ms,
      },
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Ecommerce] Execution error:', msg)
    return {
      success: false,
      message: 'E-commerce agent encountered an issue. Please try again.',
      data: { error: msg },
    }
  }
}

function buildResponseMessage(state: any): string {
  switch (state.category) {
    case 'ORDER_NEW':
      return `✅ Order ${state.orderId} confirmed. Confirmation sent to ${state.customerName}.`
    case 'ORDER_FULFILLED':
      return `🚚 Order ${state.orderId} shipped with tracking ${state.trackingNumber}.`
    case 'ORDER_CANCELLED':
      return `❌ Order ${state.orderId} cancelled. Refund initiated.`
    case 'REFUND_REQUESTED':
      return `💰 Refund of ${state.refundAmount} processed for order ${state.orderId}.`
    case 'RETURN_REQUESTED':
      return `🔄 Return request for ${state.orderId} escalated: ${state.returnReason}`
    case 'INVENTORY_LOW':
      return `⚠️ Low inventory alert: ${state.inventoryProduct} (${state.inventoryQuantity} units).`
    default:
      return state.actionSummary || 'Webhook processed.'
  }
}

async function storeConversation(ctx: EcommerceContext, responseMessage: string, state: any): Promise<void> {
  try {
    const identifier = ctx.eventId

    // Get or create conversation
    const { data: existingConv } = await (supabaseAdmin.from('conversations') as any)
      .select('id')
      .eq('agent_id', ctx.agentId)
      .eq('contact_phone_or_email', identifier)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let convId = (existingConv as any)?.id

    if (!convId) {
      const { data: newConv } = await (supabaseAdmin.from('conversations') as any)
        .insert({
          agent_id: ctx.agentId,
          user_id: ctx.userId,
          contact_phone_or_email: identifier,
          channel: ctx.channel || 'webhook',
          status: 'active',
        })
        .select('id')
        .single()
      convId = (newConv as any)?.id
    }

    // Store messages
    if (convId) {
      await (supabaseAdmin.from('messages') as any).insert([
        {
          conversation_id: convId,
          agent_id: ctx.agentId,
          role: 'user',
          content: `Shopify webhook: ${ctx.webhookTopic}`,
          channel: ctx.channel || 'webhook',
        },
        {
          conversation_id: convId,
          agent_id: ctx.agentId,
          role: 'agent',
          content: responseMessage,
          channel: ctx.channel || 'webhook',
        },
      ])
    }

    // Log execution
    await (supabaseAdmin.from('agent_executions') as any).insert({
      agent_id: ctx.agentId,
      agent_type: 'ecommerce',
      input: { topic: ctx.webhookTopic, channel: ctx.channel },
      output: { message: responseMessage, category: state.category },
      conversation_id: convId,
    })
  } catch (err) {
    console.error('[Ecommerce] Error storing conversation:', err)
  }
}
