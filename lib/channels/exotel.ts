/**
 * Exotel — India +91 phone numbers, SMS, voice
 * TRAI DND compliant. Replaces Twilio for Indian numbers.
 */

const EXOTEL_BASE = `https://${process.env.EXOTEL_API_KEY}:${process.env.EXOTEL_API_TOKEN}@api.exotel.com/v1/Accounts/${process.env.EXOTEL_SID}`

export async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const body = new URLSearchParams({
      From: process.env.EXOTEL_VIRTUAL_NUMBER ?? '',
      To: to,
      Body: message,
    })
    const res = await fetch(`${EXOTEL_BASE}/Sms/send`, { method: 'POST', body })
    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `Exotel SMS failed: ${text}` }
    }
    const data = (await res.json()) as { SMSMessage?: { Sid: string } }
    return { success: true, sid: data.SMSMessage?.Sid }
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
}

export async function makeCall(
  to: string,
  callerId: string,
  url: string
): Promise<{ success: boolean; callSid?: string; error?: string }> {
  try {
    const body = new URLSearchParams({
      From: callerId,
      To: to,
      Url: url,
      Record: 'false',
    })
    const res = await fetch(`${EXOTEL_BASE}/Calls/connect.json`, { method: 'POST', body })
    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `Exotel call failed: ${text}` }
    }
    const data = (await res.json()) as { Call?: { Sid: string } }
    return { success: true, callSid: data.Call?.Sid }
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
}
