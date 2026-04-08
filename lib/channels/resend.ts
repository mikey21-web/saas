/**
 * Resend — transactional email with per-user subdomain
 * Each user gets: agent-{userId}@mail.diyaa.ai
 * Bounce > 5% → pause. Complaint > 0.1% → suspend.
 */

interface SendEmailOptions {
  from: string
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!res.ok) {
      const err = (await res.json()) as { message?: string }
      return { success: false, error: err.message ?? 'Resend API error' }
    }

    const data = (await res.json()) as { id: string }
    return { success: true, messageId: data.id }
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
}

export function getAgentFromAddress(userId: string, agentName: string): string {
  return `${agentName} <agent-${userId}@mail.diyaa.ai>`
}

export async function sendAgentEmail(
  userId: string,
  agentName: string,
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  return sendEmail({
    from: getAgentFromAddress(userId, agentName),
    to,
    subject,
    html,
  })
}
