import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

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
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const tier = (sub.metadata as Record<string, string>).tier
      console.log(`[Stripe] Subscription ${sub.status} for tier: ${tier}`)
      // TODO: upsert subscription in Supabase
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      console.log(`[Stripe] Subscription cancelled: ${sub.id}`)
      // TODO: downgrade user to free tier in Supabase
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
      // TODO: notify user, pause agents
      break
    }
  }

  return NextResponse.json({ received: true })
}
