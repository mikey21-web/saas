/**
 * Supabase Query Functions
 *
 * ⚠️ IMPLEMENTATION NOTE:
 * These are template functions showing how to integrate Supabase.
 * Uncomment and wire these in when you've set up Supabase and run migrations.
 *
 * Current status: Awaiting Supabase setup
 * Step 1: Create Supabase project (see SUPABASE_SETUP.md)
 * Step 2: Run migrations
 * Step 3: Update executor.ts to import and use these functions
 */

import { supabase } from './client'

// Template: Agent queries
export async function getAgent(userId: string, agentId: string): Promise<any> {
  const { data, error } = await (supabase
    .from('agents' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('id', agentId)
    .single() as any)
  if (error) throw error
  return data
}

export async function getAgentsByUser(userId: string): Promise<any[]> {
  const { data, error } = await (supabase
    .from('agents' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false }) as any)
  if (error) throw error
  return data || []
}

export async function createAgent(userId: string, agentData: any): Promise<any> {
  const { data, error } = await (supabase
    .from('agents' as any)
    .insert([{ user_id: userId, ...agentData }] as any)
    .select()
    .single() as any)
  if (error) throw error
  return data
}

export async function updateAgent(userId: string, agentId: string, updates: any): Promise<any> {
  const { data, error } = await (supabase.from('agents') as any)
    .update(updates)
    .eq('user_id', userId)
    .eq('id', agentId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Template: Conversation queries
export async function getOrCreateConversation(
  userId: string,
  agentId: string,
  contactPhoneOrEmail: string,
  channel: 'whatsapp' | 'email' | 'sms' | 'phone'
): Promise<any> {
  const { data: existing } = await (supabase
    .from('conversations' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('agent_id', agentId)
    .eq('contact_phone_or_email', contactPhoneOrEmail)
    .eq('channel', channel)
    .single() as any)

  if (existing) return existing

  const { data: created, error } = await (supabase
    .from('conversations' as any)
    .insert([
      { user_id: userId, agent_id: agentId, contact_phone_or_email: contactPhoneOrEmail, channel },
    ] as any)
    .select()
    .single() as any)

  if (error) throw error
  return created
}

// Template: Message queries
export async function addMessage(message: any): Promise<any> {
  const { data, error } = await (supabase
    .from('messages' as any)
    .insert([message] as any)
    .select()
    .single() as any)
  if (error) throw error
  return data
}

export async function getConversationHistory(conversationId: string, limit = 10): Promise<any[]> {
  const { data, error } = await (supabase
    .from('messages' as any)
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit) as any)
  if (error) throw error
  return ((data || []) as any[]).reverse()
}

// Template: Contact queries
export async function getContactsByUser(userId: string): Promise<any[]> {
  const { data, error } = await (supabase
    .from('contacts' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }) as any)
  if (error) throw error
  return data || []
}

export async function createContact(userId: string, contact: any): Promise<any> {
  const { data, error } = await (supabase
    .from('contacts' as any)
    .insert([{ user_id: userId, ...contact }] as any)
    .select()
    .single() as any)
  if (error) throw error
  return data
}

// Template: Usage tracking
export async function updateAgentUsage(
  agentId: string,
  channel: 'whatsapp' | 'email' | 'sms' | 'phone' | 'api'
): Promise<void> {
  const fieldMap = {
    whatsapp: 'monthly_whatsapp_used',
    email: 'monthly_emails_used',
    sms: 'monthly_emails_used',
    phone: 'monthly_calls_used',
    api: 'monthly_api_requests',
  }
  const field = fieldMap[channel]

  // Increment usage counter
  const { error } = await (supabase.rpc as any)('increment_agent_usage', {
    agent_id: agentId,
    field_name: field,
    increment_value: 1,
  })

  if (error) throw error
}

// Template: Activity logging
export async function logActivity(
  userId: string,
  action: string,
  agentId?: string,
  details?: any
): Promise<void> {
  const { error } = await (supabase.from('activity_logs') as any).insert([
    {
      user_id: userId,
      agent_id: agentId,
      action,
      details: details ? JSON.stringify(details) : null,
    },
  ])
  if (error) console.error('Failed to log activity:', error)
}
