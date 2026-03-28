import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const priceIds = {
  intern: process.env.STRIPE_INTERN_PRICE_ID || '',
  agent: process.env.STRIPE_AGENT_PRICE_ID || '',
}

export async function POST(request: NextRequest) {
  try {
    const { tier, currency, email } = await request.json()

    if (!tier || !email || !priceIds[tier as keyof typeof priceIds]) {
      return NextResponse.json({ error: 'Invalid tier or email' }, { status: 400 })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceIds[tier as keyof typeof priceIds],
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          tier,
          email,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?tier=${tier}&currency=${currency}`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
