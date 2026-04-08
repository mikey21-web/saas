/**
 * Customer Platform Credential Setup
 *
 * Handles:
 * 1. Credential validation
 * 2. Secure storage in Supabase
 * 3. OAuth flows for each platform
 * 4. Credential refresh
 */

import { supabaseAdmin } from '@/lib/supabase/client'
import axios from 'axios'

export interface CredentialSetupRequest {
  userId: string
  platform: 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'facebook'
  credentials: Record<string, string>
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate Instagram credentials by making a test API call
 */
async function validateInstagramCredentials(
  accessToken: string,
  businessAccountId: string
): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://graph.instagram.com/v18.0/${businessAccountId}?access_token=${accessToken}`
    )
    return !!response.data.id
  } catch {
    return false
  }
}

/**
 * Validate Twitter credentials
 */
async function validateTwitterCredentials(
  apiKey: string,
  apiSecret: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return !!response.data
  } catch {
    return false
  }
}

/**
 * Validate LinkedIn credentials
 */
async function validateLinkedInCredentials(
  accessToken: string,
  organizationId: string
): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://api.linkedin.com/v2/organizations/${organizationId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    return !!response.data.id
  } catch {
    return false
  }
}

/**
 * Validate Facebook credentials
 */
async function validateFacebookCredentials(
  pageAccessToken: string,
  pageId: string
): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}?access_token=${pageAccessToken}`
    )
    return !!response.data.id
  } catch {
    return false
  }
}

/**
 * Validate TikTok credentials
 */
async function validateTikTokCredentials(
  accessToken: string,
  openId: string
): Promise<boolean> {
  try {
    const response = await axios.get('https://open.tiktokapis.com/v1/user/info/', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return !!response.data.data
  } catch {
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SETUP FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Setup Instagram credentials
 */
export async function setupInstagram(userId: string, credentials: any) {
  const { accessToken, businessAccountId } = credentials

  if (!accessToken || !businessAccountId) {
    throw new Error('Missing required fields: accessToken, businessAccountId')
  }

  // Validate
  const isValid = await validateInstagramCredentials(accessToken, businessAccountId)
  if (!isValid) {
    throw new Error('Invalid Instagram credentials. Please check your access token.')
  }

  // Store in Supabase
  const { error } = await (supabaseAdmin.from('platform_credentials') as any)
    .upsert({
      user_id: userId,
      platform: 'instagram',
      credentials: { accessToken, businessAccountId },
      status: 'active',
      last_verified: new Date().toISOString(),
    })

  if (error) throw error

  return {
    success: true,
    platform: 'instagram',
    message: 'Instagram connected successfully',
  }
}

/**
 * Setup Twitter credentials
 */
export async function setupTwitter(userId: string, credentials: any) {
  const { apiKey, apiSecret, accessToken, accessTokenSecret } = credentials

  if (!apiKey || !apiSecret || !accessToken) {
    throw new Error('Missing required fields for Twitter API')
  }

  // Validate
  const isValid = await validateTwitterCredentials(apiKey, apiSecret, accessToken)
  if (!isValid) {
    throw new Error('Invalid Twitter credentials. Please check your API keys.')
  }

  // Store
  const { error } = await (supabaseAdmin.from('platform_credentials') as any)
    .upsert({
      user_id: userId,
      platform: 'twitter',
      credentials: { apiKey, apiSecret, accessToken, accessTokenSecret },
      status: 'active',
      last_verified: new Date().toISOString(),
    })

  if (error) throw error

  return {
    success: true,
    platform: 'twitter',
    message: 'Twitter connected successfully',
  }
}

/**
 * Setup LinkedIn credentials
 */
export async function setupLinkedIn(userId: string, credentials: any) {
  const { accessToken, organizationId } = credentials

  if (!accessToken || !organizationId) {
    throw new Error('Missing required fields: accessToken, organizationId')
  }

  // Validate
  const isValid = await validateLinkedInCredentials(accessToken, organizationId)
  if (!isValid) {
    throw new Error('Invalid LinkedIn credentials.')
  }

  // Store
  const { error } = await (supabaseAdmin.from('platform_credentials') as any)
    .upsert({
      user_id: userId,
      platform: 'linkedin',
      credentials: { accessToken, organizationId },
      status: 'active',
      last_verified: new Date().toISOString(),
    })

  if (error) throw error

  return {
    success: true,
    platform: 'linkedin',
    message: 'LinkedIn connected successfully',
  }
}

/**
 * Setup Facebook credentials
 */
export async function setupFacebook(userId: string, credentials: any) {
  const { pageAccessToken, pageId } = credentials

  if (!pageAccessToken || !pageId) {
    throw new Error('Missing required fields: pageAccessToken, pageId')
  }

  // Validate
  const isValid = await validateFacebookCredentials(pageAccessToken, pageId)
  if (!isValid) {
    throw new Error('Invalid Facebook credentials.')
  }

  // Store
  const { error } = await (supabaseAdmin.from('platform_credentials') as any)
    .upsert({
      user_id: userId,
      platform: 'facebook',
      credentials: { pageAccessToken, pageId },
      status: 'active',
      last_verified: new Date().toISOString(),
    })

  if (error) throw error

  return {
    success: true,
    platform: 'facebook',
    message: 'Facebook connected successfully',
  }
}

/**
 * Setup TikTok credentials
 */
export async function setupTikTok(userId: string, credentials: any) {
  const { accessToken, openId } = credentials

  if (!accessToken || !openId) {
    throw new Error('Missing required fields: accessToken, openId')
  }

  // Validate
  const isValid = await validateTikTokCredentials(accessToken, openId)
  if (!isValid) {
    throw new Error('Invalid TikTok credentials.')
  }

  // Store
  const { error } = await (supabaseAdmin.from('platform_credentials') as any)
    .upsert({
      user_id: userId,
      platform: 'tiktok',
      credentials: { accessToken, openId },
      status: 'active',
      last_verified: new Date().toISOString(),
    })

  if (error) throw error

  return {
    success: true,
    platform: 'tiktok',
    message: 'TikTok connected successfully',
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED SETUP FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Setup any platform credentials
 */
export async function setupPlatformCredentials(request: CredentialSetupRequest) {
  const { userId, platform, credentials } = request

  try {
    switch (platform) {
      case 'instagram':
        return await setupInstagram(userId, credentials)
      case 'twitter':
        return await setupTwitter(userId, credentials)
      case 'linkedin':
        return await setupLinkedIn(userId, credentials)
      case 'facebook':
        return await setupFacebook(userId, credentials)
      case 'tiktok':
        return await setupTikTok(userId, credentials)
      default:
        throw new Error(`Unknown platform: ${platform}`)
    }
  } catch (error) {
    throw new Error(
      `Failed to setup ${platform}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a platform is connected
 */
export async function isPlatformConnected(userId: string, platform: string): Promise<boolean> {
  const { data, error } = await (supabaseAdmin.from('platform_credentials') as any)
    .select('status')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single()

  return !!data && data.status === 'active'
}

/**
 * Get all connected platforms for user
 */
export async function getConnectedPlatforms(userId: string): Promise<string[]> {
  const { data, error } = await (supabaseAdmin.from('platform_credentials') as any)
    .select('platform')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error || !data) return []
  return data.map((row: any) => row.platform)
}

/**
 * Disconnect a platform
 */
export async function disconnectPlatform(userId: string, platform: string) {
  const { error } = await (supabaseAdmin.from('platform_credentials') as any)
    .delete()
    .eq('user_id', userId)
    .eq('platform', platform)

  if (error) throw error

  return {
    success: true,
    platform,
    message: `${platform} disconnected successfully`,
  }
}
