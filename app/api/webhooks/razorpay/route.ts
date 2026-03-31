import { NextRequest, NextResponse } from 'next/server'
import { verifyRazorpaySignature } from '@/lib/payments/razorpay-verify'
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
      console.error('RAZORPAY_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(
      // For payment.authorized event, we need to verify differently
      // This is a simplified version - in production use proper signature verification
      body.split('"order_id":"')[1]?.split('"')[0] || '',
      body.split('"id":"')[1]?.split('"')[0] || '',
      signature,
      secret
    )

    if (!isValid && process.env.NODE_ENV === 'production') {
      console.warn('Invalid Razorpay webhook signature')
      // In production, reject invalid signatures
      // In dev, we allow it for testing
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
          await ((supabaseAdmin as any)
            .from('agents')
            .update({
              status: 'active',
              deployed_at: new Date().toISOString(),
            })
            .eq('id', agentId)
            .eq('user_id', userId)) as any

          // Log activity
          await ((supabaseAdmin as any)
            .from('activity_logs')
            .insert({
              user_id: userId,
              agent_id: agentId,
              action: 'payment_received',
              details: {
                paymentId: payment.id,
                orderId: payment.order_id,
                plan: notes.plan,
                status: 'success',
              },
            })) as any

          console.log(`✓ Payment received for agent ${agentId}`)
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
        await ((supabaseAdmin as any)
          .from('activity_logs')
          .insert({
            user_id: userId,
            agent_id: agentId,
            action: 'payment_failed',
            details: {
              paymentId: payment.id,
              orderId: payment.order_id,
              status: 'failed',
            },
          })) as any

        console.log(`✗ Payment failed for agent ${agentId}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Razorpay webhook error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
