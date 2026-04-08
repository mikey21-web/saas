/**
 * Razorpay Payment Link Creator
 * Directly calls Razorpay API — no n8n
 */

import axios from 'axios'

export interface PaymentLinkInput {
  amount: number // in rupees (will be converted to paise)
  clientName: string
  clientPhone?: string
  clientEmail?: string
  description: string
  invoiceNumber: string
  dueDate?: string // YYYY-MM-DD
}

export interface PaymentLinkResult {
  success: boolean
  paymentLinkId?: string
  paymentLinkUrl?: string
  error?: string
}

export async function createRazorpayPaymentLink(
  input: PaymentLinkInput
): Promise<PaymentLinkResult> {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return { success: false, error: 'Razorpay credentials not configured' }
  }

  try {
    const expiryTimestamp = input.dueDate
      ? Math.floor(new Date(input.dueDate).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // 30 days default

    const payload: Record<string, unknown> = {
      amount: input.amount * 100, // paise
      currency: 'INR',
      accept_partial: false,
      description: `Invoice ${input.invoiceNumber}: ${input.description}`,
      expire_by: expiryTimestamp,
      reference_id: input.invoiceNumber,
      notify: {
        sms: !!input.clientPhone,
        email: !!input.clientEmail,
      },
      reminder_enable: true,
      notes: {
        invoice_number: input.invoiceNumber,
        client_name: input.clientName,
      },
      callback_url: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/razorpay`
        : undefined,
      callback_method: 'get',
    }

    // Add customer if phone or email provided
    if (input.clientPhone || input.clientEmail) {
      payload.customer = {
        name: input.clientName,
        ...(input.clientPhone ? { contact: input.clientPhone } : {}),
        ...(input.clientEmail ? { email: input.clientEmail } : {}),
      }
    }

    const response = await axios.post('https://api.razorpay.com/v1/payment_links', payload, {
      auth: { username: keyId, password: keySecret },
      headers: { 'Content-Type': 'application/json' },
    })

    return {
      success: true,
      paymentLinkId: response.data.id,
      paymentLinkUrl: response.data.short_url,
    }
  } catch (error) {
    const msg = axios.isAxiosError(error)
      ? error.response?.data?.error?.description || error.message
      : String(error)
    return { success: false, error: `Razorpay error: ${msg}` }
  }
}
