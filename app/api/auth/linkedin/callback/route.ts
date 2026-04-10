import { NextRequest, NextResponse } from 'next/server';
import { verifyOAuthState } from '../../../../../lib/auth/oauth-state';
import { createClient } from '@supabase/supabase-js';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;

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
    return NextResponse.redirect('/dashboard/settings?error=linkedin_denied');
  }
  if (!code || !state) {
    return NextResponse.redirect('/dashboard/settings?error=linkedin_token_failed');
  }
  const stateData = verifyOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect('/dashboard/settings?error=linkedin_state_invalid');
  }
  const userId = stateData.userId;
  try {
    // Exchange code for token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });
    if (!tokenRes.ok) throw new Error('Token exchange failed');
    const tokenData = await tokenRes.json();
    const { access_token, expires_in } = tokenData;
    // Get user URN
    let account_id = null;
    try {
      const meRes = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        account_id = meData.id ? `urn:li:person:${meData.id}` : null;
      }
    } catch {}
    // Save to Supabase
    await supabase.from('platform_tokens').upsert({
      user_id: userId,
      platform: 'linkedin',
      access_token,
      expires_at: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : null,
      account_id,
      scopes: 'r_liteprofile,r_emailaddress,w_member_social,r_organization_social,w_organization_social',
      updated_at: new Date().toISOString(),
    }, { onConflict: ['user_id', 'platform'] });
    return NextResponse.redirect(`/dashboard/settings?connected=linkedin${account_id ? '' : '&warning=no_account_id'}`);
  } catch (e) {
    return NextResponse.redirect('/dashboard/settings?error=linkedin_token_failed');
  }
}
