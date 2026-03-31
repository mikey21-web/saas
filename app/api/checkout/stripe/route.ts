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
    const { agentId, userId, plan, agentName, email } = await request.json()

    // Support both agent-specific and tier-based checkouts
    if (!email || !plan || !priceIds[plan as keyof typeof priceIds]) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceIds[plan as keyof typeof priceIds],
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          plan,
          email,
          agent_id: agentId || '',
          user_id: userId || '',
        },
      },
      // For agent deployments, include client_reference_id to activate after payment
      ...(agentId && userId && {
        client_reference_id: `agent_${agentId}_${userId}`,
      }),
      success_url: agentId
        ? `${process.env.NEXT_PUBLIC_APP_URL}/onboard/success?agentId=${agentId}&agentName=${encodeURIComponent(agentName)}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&plan=${plan}`,
      cancel_url: agentId
        ? `${process.env.NEXT_PUBLIC_APP_URL}/onboard/${encodeURIComponent(agentName)}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/checkout?plan=${plan}`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
