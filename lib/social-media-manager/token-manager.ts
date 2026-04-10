import { createClient } from '@supabase/supabase-js';
import { Platform } from './types';
import { sendWhatsAppAlert } from './integrations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Checks if a platform token is expired or expiring within 3 days
export async function checkAndRefreshToken(userId: string, platform: Platform): Promise<string | null> {
  const { data, error } = await supabase
    .from('platform_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single();
  if (error || !data) return null;
  const { access_token, refresh_token, expires_at } = data;
  const now = Date.now();
  const expires = expires_at ? new Date(expires_at).getTime() : null;
  if (expires && expires - now > 3 * 24 * 60 * 60 * 1000) {
    return access_token;
  }
  // Refresh logic per platform
  try {
    switch (platform) {
      case 'instagram':
      case 'facebook':
        // Exchange for new long-lived token
        // ...implement Meta refresh logic here...
        break;
      case 'linkedin':
        // LinkedIn does not support refresh
        await supabase
          .from('platform_tokens')
          .update({ expires_at: new Date(0) })
          .eq('user_id', userId)
          .eq('platform', platform);
        await sendWhatsAppAlert(userId, 'Your LinkedIn token expired. Please reconnect.');
        return null;
      case 'twitter':
        // Use refresh_token to get new access_token
        // ...implement Twitter refresh logic here...
        break;
      case 'tiktok':
        // Use refresh_token grant
        // ...implement TikTok refresh logic here...
        break;
    }
  } catch (e) {
    return null;
  }
  // After refresh, re-query and return new token
  const { data: refreshed } = await supabase
    .from('platform_tokens')
    .select('access_token')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single();
  return refreshed?.access_token || null;
}

// Called by scheduler agent before every publish attempt
// If token is expired and can't be refreshed, send WhatsApp alert to user
export async function getValidToken(userId: string, platform: Platform): Promise<string | null> {
  const token = await checkAndRefreshToken(userId, platform);
  if (!token) {
    await sendWhatsAppAlert(userId, `Your ${platform} token is expired or invalid. Please reconnect in Diyaa AI.`);
  }
  return token;
}
