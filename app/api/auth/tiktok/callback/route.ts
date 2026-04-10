import { NextRequest, NextResponse } from 'next/server';
import { verifyOAuthState } from '../../../../../lib/auth/oauth-state';
import { createClient } from '@supabase/supabase-js';

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');
  if (error) {
    return NextResponse.redirect('/dashboard/settings?error=tiktok_denied');
  }
  if (!code || !state) {
    return NextResponse.redirect('/dashboard/settings?error=tiktok_token_failed');
  }
  const stateData = verifyOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect('/dashboard/settings?error=tiktok_state_invalid');
  }
  const userId = stateData.userId;
  try {
    // Exchange code for token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: TIKTOK_REDIRECT_URI,
      }),
    });
    if (!tokenRes.ok) throw new Error('Token exchange failed');
    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData.data || tokenData;
    // Get open_id
    let account_id = null;
    try {
      const meRes = await fetch('https://open.tiktokapis.com/v2/user/info/', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        account_id = meData.data?.user?.open_id || null;
      }
    } catch {}
    // Save to Supabase
    await supabase.from('platform_tokens').upsert({
      user_id: userId,
      platform: 'tiktok',
      access_token,
      refresh_token,
      expires_at: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
      account_id,
      scopes: 'user.info.basic,video.publish,video.upload',
      updated_at: new Date().toISOString(),
    }, { onConflict: ['user_id', 'platform'] });
    return NextResponse.redirect(`/dashboard/settings?connected=tiktok${account_id ? '' : '&warning=no_account_id'}`);
  } catch (e) {
    return NextResponse.redirect('/dashboard/settings?error=tiktok_token_failed');
  }
}
