import { NextRequest, NextResponse } from 'next/server';
import { checkAndRefreshToken } from '../../../../lib/social-media-manager/token-manager';

export async function POST(request: NextRequest) {
  try {
    const { platform, userId } = await request.json();
    if (!platform || !userId) {
      return NextResponse.json({ error: 'Missing platform or userId' }, { status: 400 });
    }
    const token = await checkAndRefreshToken(userId, platform);
    if (!token) {
      return NextResponse.json({ error: 'Token refresh failed or not supported' }, { status: 400 });
    }
    return NextResponse.json({ access_token: token });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}
