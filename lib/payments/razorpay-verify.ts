import crypto from 'crypto'

/**
 * Verify Razorpay payment signature
 * Used in webhook to confirm payment authenticity
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret)
    const data = `${razorpayOrderId}|${razorpayPaymentId}`
    hmac.update(data)
    const expectedSignature = hmac.digest('hex')
    return expectedSignature === razorpaySignature
  } catch {
    return false
  }
}

/**
 * Verify Stripe webhook signature
 * Used in webhook to confirm webhook authenticity
 */
export function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(body)
    const expectedSignature = `t=${Date.now()},v1=${hmac.digest('hex')}`

    // Extract v1 from signature header
    const parts = signature.split(',')
    const v1Match = parts.find((p) => p.startsWith('v1='))
    if (!v1Match) return false

    const receivedSignature = v1Match.replace('v1=', '')
    const expectedV1 = hmac.digest('hex')

    return receivedSignature === expectedV1
  } catch {
    return false
  }
}
