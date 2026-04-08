import type { CustomerSupportState } from '../types'

/**
 * Clean Answer Agent
 * Maps to n8n "cleanAnswer" code node
 * Removes markdown formatting so WhatsApp receives plain text
 */
export async function cleanAnswerAgent(state: CustomerSupportState): Promise<Partial<CustomerSupportState>> {
  let txt = state.aiResponse?.answer || ''

  // 1. Remove bold / italic / strikethrough markers (* _ ~)
  txt = txt.replace(/[*_~]+/g, '')

  // 2. Convert [Text](https://url) → Text https://url
  txt = txt.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 $2')

  // 3. Collapse 3+ blank lines into 2
  txt = txt.replace(/\n{3,}/g, '\n\n').trim()

  return { cleanedAnswer: txt }
}
