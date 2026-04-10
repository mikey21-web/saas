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
        `/dashboard/agents/office?error=${encodeURIComponent(error)}&channel=whatsapp`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `/dashboard/agents/office?error=${encodeURIComponent('Missing authorization code')}&channel=whatsapp`
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

    // Exchange code for access token (Meta OAuth)
    const tokenRes = await fetch('https://graph.instagram.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.META_APP_ID || '',
        client_secret: process.env.META_APP_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/channels/whatsapp/callback`,
      }).toString(),
    })

    if (!tokenRes.ok) {
      const error = await tokenRes.text()
      console.error('Token exchange failed:', error)
      return NextResponse.redirect(
        `/dashboard/agents/office/${agentId}?error=${encodeURIComponent('Token exchange failed')}&channel=whatsapp`
      )
    }

    const tokens = await tokenRes.json()

    // Get WhatsApp Business Account info
    const accountRes = await fetch(
      `https://graph.instagram.com/v18.0/me/owned_whatsapp_business_accounts`,
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    )

    const accountData = await accountRes.json()
    const businessAccountId = accountData.data?.[0]?.id

    // Save credentials to database
    const { error: saveError } = await (supabaseAdmin.from('channel_credentials') as any)
      .upsert(
        {
          user_id: identity.supabaseUserId,
          agent_id: agentId,
          channel_type: 'whatsapp',
          access_token: tokens.access_token,
          expires_at: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null,
          metadata: {
            business_account_id: businessAccountId,
            account_name: accountData.data?.[0]?.name,
          },
          is_connected: true,
        },
        { onConflict: 'user_id,channel_type,agent_id' }
      )

    if (saveError) {
      console.error('Failed to save credentials:', saveError)
      return NextResponse.redirect(
        `/dashboard/agents/office/${agentId}?error=${encodeURIComponent('Failed to save credentials')}&channel=whatsapp`
      )
    }

    return NextResponse.redirect(
      `/dashboard/agents/office/${agentId}?success=true&channel=whatsapp`
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `/dashboard/agents/office?error=${encodeURIComponent('An error occurred')}&channel=whatsapp`
    )
  }
}
