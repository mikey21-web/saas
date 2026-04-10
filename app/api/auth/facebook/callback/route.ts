import { NextRequest, NextResponse } from 'next/server';
import { verifyOAuthState } from '../../../../../lib/auth/oauth-state';
import { createClient } from '@supabase/supabase-js';

const META_APP_ID = process.env.META_APP_ID!;
const META_APP_SECRET = process.env.META_APP_SECRET!;
const META_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || process.env.META_REDIRECT_URI!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function exchangeForLongLivedToken(shortToken: string) {
  const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to exchange for long-lived token');
  return res.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');
  if (error) {
    return NextResponse.redirect('/dashboard/settings?error=facebook_denied');
  }
  if (!code || !state) {
    return NextResponse.redirect('/dashboard/settings?error=facebook_token_failed');
  }
  const stateData = verifyOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect('/dashboard/settings?error=facebook_state_invalid');
  }
  const userId = stateData.userId;
  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: META_REDIRECT_URI,
        code,
      }),
    });
    if (!tokenRes.ok) throw new Error('Token exchange failed');
    const tokenData = await tokenRes.json();
    let { access_token, expires_in } = tokenData;
    // Exchange for long-lived token
    const longLived = await exchangeForLongLivedToken(access_token);
    access_token = longLived.access_token;
    expires_in = longLived.expires_in;
    // Get Facebook Page
    const pagesRes = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`);
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];
    let page_id = null;
    if (page) {
      page_id = page.id;
    }
    // Save to Supabase
    await supabase.from('platform_tokens').upsert({
      user_id: userId,
      platform: 'facebook',
      access_token,
      expires_at: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
      page_id,
      scopes: 'pages_show_list,pages_read_engagement,pages_manage_posts,public_profile,email',
      updated_at: new Date().toISOString(),
    }, { onConflict: ['user_id', 'platform'] });
    return NextResponse.redirect(`/dashboard/settings?connected=facebook`);
  } catch (e) {
    return NextResponse.redirect('/dashboard/settings?error=facebook_token_failed');
  }
}
