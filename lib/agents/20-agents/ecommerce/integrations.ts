import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * Email integration for order notifications
 */
export async function sendOrderConfirmationEmail(state: any): Promise<void> {
  const { customerEmail, customerName, orderId, productName, orderTotal } = state

  if (!customerEmail) {
    console.warn('[Ecommerce] No email address for confirmation')
    return
  }

  try {
    // In production, use Resend or SendGrid
    // For now, log to console
    console.log('[Ecommerce] Email → Order Confirmed', {
      to: customerEmail,
      subject: `✅ Order Confirmed — ${orderId}`,
      body: `Hi ${customerName}, thank you for your order! Order: ${orderId}, Product: ${productName}, Total: ${orderTotal}`,
    })
  } catch (error) {
    console.error('[Ecommerce] Email send failed:', error)
  }
}

export async function sendOrderShippedEmail(state: any): Promise<void> {
  const { customerEmail, customerName, orderId, trackingNumber, carrier } = state

  if (!customerEmail) return

  try {
    console.log('[Ecommerce] Email → Order Shipped', {
      to: customerEmail,
      subject: `🚚 Shipped! ${orderId} — Track Your Order`,
      body: `Hi ${customerName}, your order ${orderId} has shipped! Carrier: ${carrier}, Tracking: ${trackingNumber}`,
    })
  } catch (error) {
    console.error('[Ecommerce] Email send failed:', error)
  }
}

export async function sendOrderCancelledEmail(state: any): Promise<void> {
  const { customerEmail, customerName, orderId } = state

  if (!customerEmail) return

  try {
    console.log('[Ecommerce] Email → Order Cancelled', {
      to: customerEmail,
      subject: `❌ Order Cancelled — ${orderId}`,
      body: `Hi ${customerName}, your order ${orderId} has been cancelled. If paid, refund in 5-7 business days.`,
    })
  } catch (error) {
    console.error('[Ecommerce] Email send failed:', error)
  }
}

export async function sendRefundInitiatedEmail(state: any): Promise<void> {
  const { customerEmail, customerName, orderId, refundAmount } = state

  if (!customerEmail) return

  try {
    console.log('[Ecommerce] Email → Refund Initiated', {
      to: customerEmail,
      subject: `💰 Refund Processed — ${orderId}`,
      body: `Hi ${customerName}, your refund for ${orderId} has been initiated. Amount: ${refundAmount}. Timeline: 5-7 business days.`,
    })
  } catch (error) {
    console.error('[Ecommerce] Email send failed:', error)
  }
}

/**
 * WhatsApp integration via Twilio/Meta
 */
export async function sendOrderConfirmationWhatsApp(state: any): Promise<void> {
  const { customerPhone, customerName, orderId, productName, orderTotal } = state

  if (!customerPhone) {
    console.warn('[Ecommerce] No phone number for WhatsApp')
    return
  }

  try {
    console.log('[Ecommerce] WhatsApp → Order Confirmed', {
      to: customerPhone,
      body: `✅ *Order Confirmed!*\n\nHi ${customerName}! 👋\n\n📦 *Order:* ${orderId}\n🛍️ *Product:* ${productName}\n💰 *Total:* ${orderTotal}\n⏱️ *Delivery:* 3–5 business days\n\nThank you for shopping! 🙏`,
    })
  } catch (error) {
    console.error('[Ecommerce] WhatsApp send failed:', error)
  }
}

export async function sendOrderShippedWhatsApp(state: any): Promise<void> {
  const { customerPhone, customerName, orderId, trackingNumber, carrier } = state

  if (!customerPhone) return

  try {
    console.log('[Ecommerce] WhatsApp → Order Shipped', {
      to: customerPhone,
      body: `🚚 *Your order has shipped!*\n\nHi ${customerName}!\n\n📦 *Order:* ${orderId}\n🏢 *Carrier:* ${carrier}\n🔍 *Tracking:* \`${trackingNumber}\`\n\nExpect delivery in 3–5 business days. 📬`,
    })
  } catch (error) {
    console.error('[Ecommerce] WhatsApp send failed:', error)
  }
}

export async function sendOrderCancelledWhatsApp(state: any): Promise<void> {
  const { customerPhone, customerName, orderId } = state

  if (!customerPhone) return

  try {
    console.log('[Ecommerce] WhatsApp → Order Cancelled', {
      to: customerPhone,
      body: `❌ *Order Cancelled*\n\nHi ${customerName}, your order ${orderId} has been cancelled.\n\nIf you paid, a refund will be processed in 5–7 business days. Sorry for the inconvenience! 🙏`,
    })
  } catch (error) {
    console.error('[Ecommerce] WhatsApp send failed:', error)
  }
}

export async function sendRefundInitiatedWhatsApp(state: any): Promise<void> {
  const { customerPhone, customerName, orderId, refundAmount } = state

  if (!customerPhone) return

  try {
    console.log('[Ecommerce] WhatsApp → Refund Initiated', {
      to: customerPhone,
      body: `💰 *Refund Processed!*\n\nHi ${customerName},\n\n✅ Your refund for order ${orderId} has been initiated.\n\n💵 *Amount:* ${refundAmount}\n⏱️ *Timeline:* 5–7 Business Days\n\nAmount will be credited to your original payment method. 🙏`,
    })
  } catch (error) {
    console.error('[Ecommerce] WhatsApp send failed:', error)
  }
}

/**
 * Shopify API: Process Refund
 */
export async function processShopifyRefund(state: any): Promise<boolean> {
  const { orderId } = state

  if (!orderId) {
    console.warn('[Ecommerce] No order ID for refund')
    return false
  }

  try {
    const shopifyStore = process.env.SHOPIFY_STORE || 'store'
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || ''

    const response = await fetch(
      `https://${shopifyStore}.myshopify.com/admin/api/2024-01/orders/${orderId.replace('#', '')}/refunds.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refund: {
            notify: true,
            note: 'Auto-processed by Ecommerce Operations Agent',
          },
        }),
      }
    )

    if (!response.ok) {
      console.error('[Ecommerce] Shopify refund failed:', response.status, await response.text())
      return false
    }

    console.log('[Ecommerce] Shopify refund processed for', orderId)
    return true
  } catch (error) {
    console.error('[Ecommerce] Shopify refund error:', error)
    return false
  }
}

/**
 * Supabase: Log event for audit trail
 */
export async function logEventToSupabase(state: any): Promise<void> {
  try {
    await supabaseAdmin.from('ecommerce_events').insert({
      event_id: state.eventId,
      topic: state.webhookTopic,
      category: state.category,
      order_id: state.orderId,
      customer_email: state.customerEmail,
      customer_phone: state.customerPhone,
      status: 'PROCESSED',
      action_summary: state.actionSummary,
      raw_payload: JSON.stringify(state.webhookPayload).substring(0, 1000),
      received_at: state.receivedAt,
    })
  } catch (error) {
    console.error('[Ecommerce] Failed to log event:', error)
  }
}
