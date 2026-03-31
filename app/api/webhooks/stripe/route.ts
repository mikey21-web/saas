import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch (e: unknown) {
    console.error('Stripe webhook signature failed:', e)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    // Handle checkout.session.completed (agent deployment)
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.client_reference_id && session.payment_status === 'paid') {
        // client_reference_id format: "agent_{agentId}_{userId}"
        const parts = session.client_reference_id.split('_')
        const [prefix, agentId, userId] = [parts[0], parts[1], parts.slice(2).join('_')]

        if (prefix === 'agent' && agentId && userId) {
          const plan = (session.metadata?.plan as 'intern' | 'agent') || 'agent'

          // Mark agent as deployed
          const { error } = await ((supabaseAdmin as any)
            .from('agents')
            .update({
              status: 'active',
              deployed_at: new Date().toISOString(),
            })
            .eq('id', agentId)
            .eq('user_id', userId)) as any

          if (!error) {
            // Log activity
            await ((supabaseAdmin as any).from('activity_logs').insert({
              user_id: userId,
              agent_id: agentId,
              action: 'payment_received',
              details: {
                paymentId: session.payment_intent,
                sessionId: session.id,
                plan,
                status: 'success',
                amount: session.amount_total ? session.amount_total / 100 : 0,
                currency: session.currency,
              },
            })) as any
            console.log(`✓ Payment received for agent ${agentId}`)
          }
        }
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const tier = (sub.metadata as Record<string, string>).tier
      console.log(`[Stripe] Subscription ${sub.status} for tier: ${tier}`)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      console.log(`[Stripe] Subscription cancelled: ${sub.id}`)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      console.log(`[Stripe] Payment succeeded: ${invoice.amount_paid}`)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.error(`[Stripe] Payment failed for ${invoice.customer}`)
      break
    }

    case 'charge.failed': {
      const charge = event.data.object as Stripe.Charge
      const agentId = charge.metadata?.agent_id
      const userId = charge.metadata?.user_id

      if (agentId && userId) {
        // Log failed payment
        await ((supabaseAdmin as any).from('activity_logs').insert({
          user_id: userId,
          agent_id: agentId,
          action: 'payment_failed',
          details: {
            paymentId: charge.id,
            failureCode: charge.failure_code,
            failureMessage: charge.failure_message,
            status: 'failed',
          },
        })) as any
        console.log(`✗ Payment failed for agent ${agentId}`)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
