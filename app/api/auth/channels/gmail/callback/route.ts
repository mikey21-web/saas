import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { resolveAuthIdentity } from '@/lib/auth/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    const state = req.nextUrl.searchParams.get('state')
    const error = req.nextUrl.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `/dashboard/agents/office?error=${encodeURIComponent(error)}&channel=gmail`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `/dashboard/agents/office?error=${encodeURIComponent('Missing authorization code')}&channel=gmail`
      )
    }

    // Decode state to get agentId
    const { agentId } = JSON.parse(Buffer.from(state, 'base64').toString())

    // Get user from auth token
    const identity = await resolveAuthIdentity(req)
    if (!identity) {
      return NextResponse.redirect(
        `/sign-in?redirect=${encodeURIComponent(req.url)}`
      )
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/channels/gmail/callback`,
        grant_type: 'authorization_code',
      }).toString(),
    })

    if (!tokenRes.ok) {
      const error = await tokenRes.text()
      console.error('Token exchange failed:', error)
      return NextResponse.redirect(
        `/dashboard/agents/office/${agentId}?error=${encodeURIComponent('Token exchange failed')}&channel=gmail`
      )
    }

    const tokens = await tokenRes.json()

    // Get user email from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const userData = await userRes.json()

    // Save credentials to database
    const { error: saveError } = await (supabaseAdmin.from('channel_credentials') as any)
      .upsert(
        {
          user_id: identity.supabaseUserId,
          agent_id: agentId,
          channel_type: 'gmail',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          metadata: {
            email: userData.email,
            name: userData.name,
          },
          is_connected: true,
        },
        { onConflict: 'user_id,channel_type,agent_id' }
      )

    if (saveError) {
      console.error('Failed to save credentials:', saveError)
      return NextResponse.redirect(
        `/dashboard/agents/office/${agentId}?error=${encodeURIComponent('Failed to save credentials')}&channel=gmail`
      )
    }

    return NextResponse.redirect(
      `/dashboard/agents/office/${agentId}?success=true&channel=gmail`
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `/dashboard/agents/office?error=${encodeURIComponent('An error occurred')}&channel=gmail`
    )
  }
}
