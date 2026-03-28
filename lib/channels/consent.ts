/**
 * TRAI DND Compliance — Consent Layer
 * Every outbound action checks consent before executing.
 * violating = ₹1,500 fine per message under TRAI regulations
 */

export type ConsentType = 'whatsapp' | 'sms' | 'call' | 'email'

export interface Contact {
  id: string
  phone?: string
  email?: string
  whatsapp_consent: boolean
  sms_consent: boolean
  call_consent: boolean
  email_consent: boolean
  consent_date?: string
  consent_source?: 'form' | 'inbound' | 'manual'
}

export class ConsentError extends Error {
  constructor(public channel: ConsentType, public contactId: string) {
    super(`DND_BLOCKED: Contact ${contactId} has not consented to ${channel} messages`)
    this.name = 'ConsentError'
  }
}

export function checkConsent(contact: Contact, channel: ConsentType): void {
  const consentMap: Record<ConsentType, boolean> = {
    whatsapp: contact.whatsapp_consent,
    sms: contact.sms_consent,
    call: contact.call_consent,
    email: contact.email_consent,
  }

  if (!consentMap[channel]) {
    throw new ConsentError(channel, contact.id)
  }
}

export function isInboundConsent(source: Contact['consent_source']): boolean {
  // Inbound contacts = implicit consent (they initiated contact)
  return source === 'inbound'
}
