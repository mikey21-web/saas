/**
 * Supabase Queries for Agent Credentials
 *
 * Handles secure storage/retrieval of encrypted credentials
 * All sensitive fields are encrypted before storage
 */

import { supabase, supabaseAdmin } from '@/lib/supabase/client'
import { encryptCredential, decryptCredential, generateWebhookToken } from '@/lib/credentials/vault'
import type { AgentCredentials } from '@/lib/credentials/vault'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoredCredential {
  id: string
  user_id: string
  agent_id: string
  whatsapp_number?: string
  whatsapp_verified?: boolean
  website_url?: string
  website_verified?: boolean
  openai_api_key?: string // encrypted
  groq_api_key?: string // encrypted
  custom_ai_key?: string // encrypted
  custom_ai_provider?: 'openai' | 'groq' | 'gemini' | 'anthropic'
  auth_token?: string // encrypted
  webhook_url?: string
  created_at: string
  last_verified?: string
  last_rotated?: string
}

// ─── Create/Update Credentials ────────────────────────────────────────────────

/**
 * Store agent credentials (encrypts sensitive fields)
 */
export async function saveAgentCredentials(
  userId: string,
  agentId: string,
  creds: Partial<AgentCredentials>
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp/${agentId}`
    const authToken = generateWebhookToken()

    const encryptedCreds: Record<string, unknown> = {
      user_id: userId,
      agent_id: agentId,
      whatsapp_number: creds.whatsapp_number,
      whatsapp_verified: false,
      website_url: creds.website_url,
      website_verified: creds.website_verified || false,
      custom_ai_provider: creds.custom_ai_provider,
      webhook_url: webhookUrl,
      auth_token: encryptCredential(authToken),
      created_at: new Date().toISOString(),
      last_verified: new Date().toISOString(),
    }

    // Encrypt sensitive API keys
    if (creds.openai_api_key) {
      encryptedCreds.openai_api_key = encryptCredential(creds.openai_api_key)
    }
    if (creds.groq_api_key) {
      encryptedCreds.groq_api_key = encryptCredential(creds.groq_api_key)
    }
    if (creds.custom_ai_key) {
      encryptedCreds.custom_ai_key = encryptCredential(creds.custom_ai_key)
    }

    // Use service role to bypass RLS for credential storage (highly secure)
    const { data, error } = await (supabaseAdmin.from('agent_credentials') as any)
      .upsert(encryptedCreds, {
        onConflict: 'agent_id',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to save credentials:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      credentialId: data?.id,
    }
  } catch (err) {
    console.error('Credential save error:', err)
    return { success: false, error: String(err) }
  }
}

// ─── Retrieve Credentials ────────────────────────────────────────────────────

/**
 * Get decrypted credentials for an agent
 * Only the owner (user) can retrieve their own credentials
 */
export async function getAgentCredentials(
  userId: string,
  agentId: string
): Promise<Partial<AgentCredentials> | null> {
  try {
    const { data, error } = await (supabase.from('agent_credentials') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .single()

    if (error) {
      console.error('Failed to fetch credentials:', error)
      return null
    }

    if (!data) return null

    // Decrypt sensitive fields
    const decrypted: Partial<AgentCredentials> = {
      id: data.id,
      user_id: data.user_id,
      agent_id: data.agent_id,
      whatsapp_number: data.whatsapp_number,
      whatsapp_verified: data.whatsapp_verified,
      website_url: data.website_url,
      website_verified: data.website_verified,
      custom_ai_provider: data.custom_ai_provider,
      webhook_url: data.webhook_url,
      created_at: new Date(data.created_at),
      last_verified: data.last_verified ? new Date(data.last_verified) : undefined,
      last_rotated: data.last_rotated ? new Date(data.last_rotated) : undefined,
    }

    if (data.openai_api_key) {
      decrypted.openai_api_key = decryptCredential(data.openai_api_key)
    }
    if (data.groq_api_key) {
      decrypted.groq_api_key = decryptCredential(data.groq_api_key)
    }
    if (data.custom_ai_key) {
      decrypted.custom_ai_key = decryptCredential(data.custom_ai_key)
    }

    return decrypted
  } catch (err) {
    console.error('Error retrieving credentials:', err)
    return null
  }
}

/**
 * Get credentials using auth token (for webhook verification)
 * Does NOT decrypt keys - only used for webhook auth check
 */
export async function getCredentialsByAuthToken(
  agentId: string,
  authToken: string
): Promise<{ valid: boolean; userId?: string }> {
  try {
    const { data, error } = await (supabase.from('agent_credentials') as any)
      .select('user_id, auth_token')
      .eq('agent_id', agentId)
      .single()

    if (error || !data) {
      return { valid: false }
    }

    const storedToken = decryptCredential(data.auth_token)

    if (storedToken === authToken) {
      return { valid: true, userId: data.user_id }
    }

    return { valid: false }
  } catch (err) {
    console.error('Auth token verification failed:', err)
    return { valid: false }
  }
}

// ─── Update Credential Status ────────────────────────────────────────────────

/**
 * Mark credentials as verified (after successful test)
 */
export async function markCredentialsVerified(
  userId: string,
  agentId: string,
  fields: { whatsapp_verified?: boolean; website_verified?: boolean }
): Promise<boolean> {
  try {
    const update: Record<string, unknown> = {
      last_verified: new Date().toISOString(),
    }

    if (fields.whatsapp_verified !== undefined) {
      update.whatsapp_verified = fields.whatsapp_verified
    }
    if (fields.website_verified !== undefined) {
      update.website_verified = fields.website_verified
    }

    const { error } = await (supabase.from('agent_credentials') as any)
      .update(update)
      .eq('user_id', userId)
      .eq('agent_id', agentId)

    return !error
  } catch (err) {
    console.error('Failed to update credential status:', err)
    return false
  }
}

/**
 * Rotate API key (e.g., when user updates it)
 */
export async function rotateApiKey(
  userId: string,
  agentId: string,
  provider: 'openai' | 'groq' | 'custom',
  newKey: string
): Promise<boolean> {
  try {
    const update: Record<string, unknown> = {
      last_rotated: new Date().toISOString(),
    }

    if (provider === 'openai') {
      update.openai_api_key = encryptCredential(newKey)
    } else if (provider === 'groq') {
      update.groq_api_key = encryptCredential(newKey)
    } else {
      update.custom_ai_key = encryptCredential(newKey)
    }

    const { error } = await (supabase.from('agent_credentials') as any)
      .update(update)
      .eq('user_id', userId)
      .eq('agent_id', agentId)

    return !error
  } catch (err) {
    console.error('Failed to rotate API key:', err)
    return false
  }
}

// ─── Delete Credentials ───────────────────────────────────────────────────────

/**
 * Securely delete credentials (e.g., when agent is deleted)
 */
export async function deleteAgentCredentials(userId: string, agentId: string): Promise<boolean> {
  try {
    const { error } = await (supabase.from('agent_credentials') as any)
      .delete()
      .eq('user_id', userId)
      .eq('agent_id', agentId)

    return !error
  } catch (err) {
    console.error('Failed to delete credentials:', err)
    return false
  }
}
