import type { CustomerSupportState } from '../types'

/**
 * Time Check Agent
 * Maps to n8n "24-hour window check" code node
 * Checks if message was received within the 24-hour WhatsApp conversation window
 */
export async function timeCheckAgent(state: CustomerSupportState): Promise<Partial<CustomerSupportState>> {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
  const withinWindow = Date.now() - state.messageTimestamp < TWENTY_FOUR_HOURS

  return { withinWindow }
}
