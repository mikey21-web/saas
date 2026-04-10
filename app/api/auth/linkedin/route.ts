import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthState } from '../../../../lib/auth/oauth-state';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;

const SCOPES = [
  'r_liteprofile',
  'r_emailaddress',
  'w_member_social',
  'r_organization_social',
  'w_organization_social',
].join(' ');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.redirect('/dashboard/settings?error=linkedin_missing_user');
    }
    const state = generateOAuthState(userId);
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
      `&client_id=${LINKEDIN_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&state=${encodeURIComponent(state)}`;
    return NextResponse.redirect(authUrl);
  } catch (e) {
    return NextResponse.redirect('/dashboard/settings?error=linkedin_oauth_error');
  }
}
