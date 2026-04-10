import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthState } from '../../../../lib/auth/oauth-state';
import crypto from 'crypto';

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI!;
const SCOPES = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'offline.access',
].join(' ');

function base64url(input: Buffer) {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.redirect('/dashboard/settings?error=twitter_missing_user');
    }
    // PKCE
    const code_verifier = base64url(crypto.randomBytes(32));
    const code_challenge = base64url(crypto.createHash('sha256').update(code_verifier).digest());
    // Store code_verifier in httpOnly cookie
    const state = generateOAuthState(userId);
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code` +
      `&client_id=${TWITTER_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(TWITTER_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&state=${encodeURIComponent(state)}` +
      `&code_challenge=${code_challenge}` +
      `&code_challenge_method=S256`;
    const res = NextResponse.redirect(authUrl);
    res.cookies.set('twitter_code_verifier', code_verifier, { httpOnly: true, secure: true, path: '/', sameSite: 'lax', maxAge: 600 });
    return res;
  } catch (e) {
    return NextResponse.redirect('/dashboard/settings?error=twitter_oauth_error');
  }
}
