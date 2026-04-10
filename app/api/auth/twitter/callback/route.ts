import { NextRequest, NextResponse } from 'next/server';
import { verifyOAuthState } from '../../../../../lib/auth/oauth-state';
import { createClient } from '@supabase/supabase-js';

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getCookie(request: NextRequest, name: string): string | null {
  const cookie = request.cookies.get(name);
  return cookie?.value || null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');
  if (error) {
    return NextResponse.redirect('/dashboard/settings?error=twitter_denied');
  }
  if (!code || !state) {
    return NextResponse.redirect('/dashboard/settings?error=twitter_token_failed');
  }
  const stateData = verifyOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect('/dashboard/settings?error=twitter_state_invalid');
  }
  const userId = stateData.userId;
  try {
    // PKCE
    const code_verifier = getCookie(request, 'twitter_code_verifier');
    if (!code_verifier) {
      return NextResponse.redirect('/dashboard/settings?error=twitter_pkce_missing');
    }
    // Exchange code for token
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}` },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier,
        client_id: TWITTER_CLIENT_ID,
      }),
    });
    if (!tokenRes.ok) throw new Error('Token exchange failed');
    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;
    // Get username
    let username = null;
    try {
      const meRes = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        username = meData.data?.username || null;
      }
    } catch {}
    // Save to Supabase
    await supabase.from('platform_tokens').upsert({
      user_id: userId,
      platform: 'twitter',
      access_token,
      refresh_token,
      expires_at: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
      username,
      scopes: 'tweet.read,tweet.write,users.read,offline.access',
      updated_at: new Date().toISOString(),
    }, { onConflict: ['user_id', 'platform'] });
    // Clear code_verifier cookie
    const res = NextResponse.redirect(`/dashboard/settings?connected=twitter${username ? '' : '&warning=no_account_id'}`);
    res.cookies.set('twitter_code_verifier', '', { maxAge: 0, path: '/' });
    return res;
  } catch (e) {
    return NextResponse.redirect('/dashboard/settings?error=twitter_token_failed');
  }
}
