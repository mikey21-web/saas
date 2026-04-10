import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthState } from '../../../../lib/auth/oauth-state';

const META_APP_ID = process.env.META_APP_ID!;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI!;

const SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
  'instagram_manage_insights',
  'pages_show_list',
  'pages_read_engagement',
].join(',');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.redirect('/dashboard/settings?error=instagram_missing_user');
    }
    const state = generateOAuthState(userId);
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(state)}`;
    return NextResponse.redirect(authUrl);
  } catch (e) {
    return NextResponse.redirect('/dashboard/settings?error=instagram_oauth_error');
  }
}
