import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const OAUTH_CONFIG = {
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/channels/gmail/callback`,
    scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly',
    endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  whatsapp: {
    clientId: process.env.META_APP_ID,
    clientSecret: process.env.META_APP_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/channels/whatsapp/callback`,
    scope: 'whatsapp_business_messaging,whatsapp_business_management',
    endpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
  },
  telegram: {
    // Telegram doesn't use OAuth for bot tokens, will be handled via form
    redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/channels/telegram/callback`,
  },
}

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider as 'gmail' | 'whatsapp' | 'telegram'
  const agentId = req.nextUrl.searchParams.get('agentId')

  if (!agentId) {
    return NextResponse.json({ error: 'Missing agentId' }, { status: 400 })
  }

  if (provider === 'telegram') {
    // Telegram uses manual token entry, redirect to a form
    return NextResponse.redirect(
      `/dashboard/agents/office/${agentId}?tab=settings&action=connect_telegram`
    )
  }

  const config = OAUTH_CONFIG[provider]
  if (!config) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  if (provider === 'gmail') {
    const params = new URLSearchParams({
      client_id: config.clientId || '',
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
      access_type: 'offline',
      prompt: 'consent',
      state: Buffer.from(JSON.stringify({ agentId })).toString('base64'),
    })

    return NextResponse.redirect(`${config.endpoint}?${params.toString()}`)
  }

  if (provider === 'whatsapp') {
    const params = new URLSearchParams({
      client_id: config.clientId || '',
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
      state: Buffer.from(JSON.stringify({ agentId })).toString('base64'),
    })

    return NextResponse.redirect(`${config.endpoint}?${params.toString()}`)
  }

  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
