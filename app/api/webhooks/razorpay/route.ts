import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay-verify'
import { supabaseAdmin } from '@/lib/supabase/client'

export const runtime = 'nodejs'

interface RazorpayWebhookBody {
  event: string
  payload: {
    payment: {
      entity: {
        id: string
        order_id: string
        status: string
        notes?: {
          userId?: string
          agentType?: string
          plan?: string
          agentId?: string
        }
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || ''

    if (!secret) {
      // console.error('RAZORPAY_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    const isValid = verifyRazorpayWebhookSignature(body, signature, secret)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(body) as RazorpayWebhookBody

    // Handle payment.authorized event
    if (data.event === 'payment.authorized') {
      const payment = data.payload.payment.entity
      const notes = payment.notes || {}

      if (payment.status === 'captured' || payment.status === 'authorized') {
        // Payment successful - activate agent
        const userId = notes.userId
        const agentId = notes.agentId

        if (userId && agentId) {
          // Mark agent as deployed
          await (supabaseAdmin as any)
            .from('agents')
            .update({
              status: 'active',
              deployed_at: new Date().toISOString(),
            })
            .eq('id', agentId)
            .eq('user_id', userId)

          // Log activity
          await (supabaseAdmin as any).from('activity_logs').insert({
            user_id: userId,
            agent_id: agentId,
            action: 'payment_received',
            details: {
              paymentId: payment.id,
              orderId: payment.order_id,
              plan: notes.plan,
              status: 'success',
            },
          })

          // console.log(`✓ Payment received for agent ${agentId}`)
        }
      }
    }

    // Handle payment.failed event
    if (data.event === 'payment.failed') {
      const payment = data.payload.payment.entity
      const notes = payment.notes || {}

      const userId = notes.userId
      const agentId = notes.agentId

      if (userId && agentId) {
        // Log failed payment
        await (supabaseAdmin as any).from('activity_logs').insert({
          user_id: userId,
          agent_id: agentId,
          action: 'payment_failed',
          details: {
            paymentId: payment.id,
            orderId: payment.order_id,
            status: 'failed',
          },
        })

        // console.log(`✗ Payment failed for agent ${agentId}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // console.error('Razorpay webhook error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
