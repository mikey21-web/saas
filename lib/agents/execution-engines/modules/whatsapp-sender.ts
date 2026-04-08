/**
 * WhatsApp Invoice Sender via Evolution API
 * Sends invoice PDF + payment link to client
 */

import axios from 'axios'

export interface WhatsAppInvoiceMessage {
  to: string // phone number with country code, e.g. +919876543210
  clientName: string
  invoiceNumber: string
  amount: number
  gstTotal: number
  description: string
  paymentLink?: string
  pdfBase64?: string
  pdfUrl?: string
  instanceName?: string // Evolution API instance
}

function buildInvoiceMessage(input: WhatsAppInvoiceMessage): string {
  const lines = [
    `Hi ${input.clientName}! 👋`,
    ``,
    `📄 *Invoice ${input.invoiceNumber}*`,
    ``,
    `📝 *Description:* ${input.description}`,
    `💰 *Amount:* ₹${input.amount.toLocaleString('en-IN')}`,
    `🧾 *Total (with GST):* ₹${input.gstTotal.toLocaleString('en-IN')}`,
    ``,
  ]

  if (input.paymentLink) {
    lines.push(`💳 *Pay Online:*`)
    lines.push(input.paymentLink)
    lines.push(``)
  }

  if (input.pdfUrl) {
    lines.push(`📎 *Invoice PDF:*`)
    lines.push(input.pdfUrl)
    lines.push(``)
  }

  lines.push(`Thank you for your business! 🙏`)
  lines.push(`_Please reach out if you have any questions._`)

  return lines.join('\n')
}

export async function sendInvoiceViaWhatsApp(
  input: WhatsAppInvoiceMessage
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const evolutionKey = process.env.EVOLUTION_API_KEY
  const instanceName = input.instanceName || process.env.EVOLUTION_INSTANCE_NAME || 'default'

  if (!evolutionUrl || !evolutionKey) {
    return { success: false, error: 'Evolution API not configured' }
  }

  // Normalize phone: strip spaces/dashes, ensure + prefix
  let phone = input.to.replace(/[\s\-()]/g, '')
  if (!phone.startsWith('+')) phone = '+' + phone
  // Evolution API expects number without '+'
  const evolutionPhone = phone.replace('+', '') + '@s.whatsapp.net'

  const message = buildInvoiceMessage(input)

  try {
    // Send text message with invoice details + payment link
    const textResponse = await axios.post(
      `${evolutionUrl}/message/sendText/${instanceName}`,
      {
        number: evolutionPhone,
        textMessage: { text: message },
        options: { delay: 1000, presence: 'composing' },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: evolutionKey,
        },
      }
    )

    // If PDF base64 is available, send as document
    if (input.pdfBase64) {
      await axios.post(
        `${evolutionUrl}/message/sendMedia/${instanceName}`,
        {
          number: evolutionPhone,
          mediatype: 'document',
          mimetype: 'application/pdf',
          caption: `Invoice ${input.invoiceNumber}`,
          media: input.pdfBase64,
          fileName: `Invoice_${input.invoiceNumber}.pdf`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: evolutionKey,
          },
        }
      )
    }

    return {
      success: true,
      messageId: textResponse.data?.key?.id,
    }
  } catch (error) {
    const msg = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : String(error)
    return { success: false, error: `WhatsApp send failed: ${msg}` }
  }
}

export async function sendPaymentReminderWhatsApp(
  phone: string,
  clientName: string,
  invoiceNumber: string,
  amount: number,
  daysOverdue: number,
  paymentLink?: string,
  instanceName?: string
): Promise<{ success: boolean; error?: string }> {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const evolutionKey = process.env.EVOLUTION_API_KEY
  const instance = instanceName || process.env.EVOLUTION_INSTANCE_NAME || 'default'

  if (!evolutionUrl || !evolutionKey) {
    return { success: false, error: 'Evolution API not configured' }
  }

  let urgency = '📋'
  let tone = 'gentle reminder'
  if (daysOverdue >= 7) {
    urgency = '⚠️'
    tone = 'urgent reminder'
  }
  if (daysOverdue >= 14) {
    urgency = '🚨'
    tone = 'FINAL NOTICE'
  }

  const lines = [
    `${urgency} *Payment ${tone}*`,
    ``,
    `Hi ${clientName},`,
    ``,
    `Invoice *${invoiceNumber}* for ₹${amount.toLocaleString('en-IN')} is ${daysOverdue > 0 ? `${daysOverdue} day(s) overdue` : 'due today'}.`,
    ``,
  ]

  if (paymentLink) {
    lines.push(`💳 Pay now: ${paymentLink}`)
    lines.push(``)
  }

  lines.push(`Please contact us if you have any questions.`)

  let normalizedPhone = phone.replace(/[\s\-()]/g, '')
  if (!normalizedPhone.startsWith('+')) normalizedPhone = '+' + normalizedPhone
  const evolutionPhone = normalizedPhone.replace('+', '') + '@s.whatsapp.net'

  try {
    await axios.post(
      `${evolutionUrl}/message/sendText/${instance}`,
      {
        number: evolutionPhone,
        textMessage: { text: lines.join('\n') },
        options: { delay: 1000 },
      },
      {
        headers: { 'Content-Type': 'application/json', apikey: evolutionKey },
      }
    )
    return { success: true }
  } catch (error) {
    const msg = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : String(error)
    return { success: false, error: msg }
  }
}
