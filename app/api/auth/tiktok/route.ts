import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthState } from '../../../../lib/auth/oauth-state';

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI!;
const SCOPES = [
  'user.info.basic',
  'video.publish',
  'video.upload',
].join(',');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.redirect('/dashboard/settings?error=tiktok_missing_user');
    }
    const state = generateOAuthState(userId);
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${TIKTOK_CLIENT_KEY}` +
      `&redirect_uri=${encodeURIComponent(TIKTOK_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(state)}`;
    return NextResponse.redirect(authUrl);
  } catch (e) {
    return NextResponse.redirect('/dashboard/settings?error=tiktok_oauth_error');
  }
}
