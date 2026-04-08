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
    if (expectedSignature.length !== razorpaySignature.length) {
      return false
    }
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(razorpaySignature, 'utf8')
    )
  } catch {
    return false
  }
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    if (expectedSignature.length !== signature.length) {
      return false
    }
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    )
  } catch {
    return false
  }
}

/**
 * Verify Stripe webhook signature
 * Used in webhook to confirm webhook authenticity
 */
export function verifyStripeSignature(body: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(body)
    const expectedV1 = hmac.digest('hex')

    // Extract v1 from signature header
    const parts = signature.split(',')
    const v1Match = parts.find((p) => p.startsWith('v1='))
    if (!v1Match) return false

    const receivedSignature = v1Match.replace('v1=', '')

    return receivedSignature === expectedV1
  } catch {
    return false
  }
}
