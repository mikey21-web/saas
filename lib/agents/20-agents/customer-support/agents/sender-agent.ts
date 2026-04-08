import type { CustomerSupportState } from '../types'
import { sendWhatsAppMessage, sendWhatsAppTemplate } from '../integrations'

/**
 * Sender Agent
 * Maps to n8n "Send AI Agent's Answer" + "Send Pre-approved Template Message" nodes
 * Routes based on withinWindow (maps to n8n IF node)
 */
export async function senderAgent(state: CustomerSupportState): Promise<Partial<CustomerSupportState>> {
  const { phoneNumber, cleanedAnswer, withinWindow } = state

  let success = false

  if (withinWindow) {
    // Within 24h — send the AI answer directly (maps to n8n "Send AI Agent's Answer")
    success = await sendWhatsAppMessage(phoneNumber, cleanedAnswer)
  } else {
    // Outside 24h — send template to reopen conversation (maps to n8n template node)
    success = await sendWhatsAppTemplate(phoneNumber)
  }

  return { sentSuccessfully: success }
}
