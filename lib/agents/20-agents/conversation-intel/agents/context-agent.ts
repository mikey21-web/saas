import { supabaseAdmin } from '@/lib/supabase/client'
import { ConversationIntelState } from '../types'

/**
 * Context Agent: Loads conversation history + CRM contact from Supabase
 * Maps to n8n: Fetch Conversation History + Fetch CRM Contact → Build Context
 */
export async function contextAgent(state: ConversationIntelState): Promise<Partial<ConversationIntelState>> {
  const [historyResult, contactResult] = await Promise.all([
    (supabaseAdmin.from('conversation_history') as any)
      .select('role, text, intent_score, emotion, stage, created_at')
      .eq('phone', state.from)
      .order('created_at', { ascending: false })
      .limit(20),
    (supabaseAdmin.from('contacts') as any)
      .select('stage, deal_value, churn_risk, upsell_opportunity')
      .eq('phone', state.from)
      .single(),
  ])

  const history = (historyResult.data || []).reverse()
  const contact = contactResult.data || {}

  const historyText = history.map((h: any) => `[${h.role}]: ${h.text}`).join('\n')
  const dealValue = contact.deal_value ? parseFloat(contact.deal_value) : null

  return {
    historyText,
    dealValue,
    isVip: (dealValue || 0) > 100000,
    conversationCount: history.length,
    crmStage: contact.stage || 'unknown',
  }
}
