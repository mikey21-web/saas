import { NextRequest, NextResponse } from 'next/server'

// This is a simplified Razorpay integration
// In production, use the Razorpay SDK: npm install razorpay
export async function POST(request: NextRequest) {
  try {
    const { tier, amount, email } = await request.json()

    if (!tier || !amount || !email) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Create Razorpay order via API
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        amount, // in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          tier,
          email,
        },
      }),
    })

    const orderData = await razorpayResponse.json()

    if (!razorpayResponse.ok) {
      console.error('Razorpay error:', orderData)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      orderId: orderData.id,
      amount: orderData.amount,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Razorpay checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
