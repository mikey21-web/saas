import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

interface EmailPayload {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
}

export async function POST(req: NextRequest) {
  const payload: EmailPayload = await req.json()
  const { to, subject, html, text, from, replyTo } = payload

  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured. Email would be sent to:', to)
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email logged (RESEND_API_KEY not set)',
        to,
        subject,
        preview: 'Email would be sent when Resend is configured',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const recipients = Array.isArray(to) ? to : [to]
  const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'diyaa@aiagents.saas'

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject: subject,
        html: html || `<p>${text || ''}</p>`,
        text: text,
        reply_to: replyTo,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Resend API error')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        id: data.id,
        to: recipients,
        subject,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Email send error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
        to: recipients,
        subject,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      service: 'diyaa.ai Email API',
      provider: 'Resend',
      status: process.env.RESEND_API_KEY ? 'configured' : 'pending',
      instructions: 'Set RESEND_API_KEY in .env.local to enable email sending',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
