import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { resolveAuthIdentity } from '@/lib/auth/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const identity = await resolveAuthIdentity(req)
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agentId = req.nextUrl.searchParams.get('agentId')
    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 })
    }

    // Fetch channel credentials for this user
    const { data: credentials, error } = await (supabaseAdmin.from('channel_credentials') as any)
      .select('*')
      .eq('user_id', identity.supabaseUserId)
      .eq('agent_id', agentId)

    if (error) {
      console.error('Failed to fetch credentials:', error)
      return NextResponse.json({ channels: [] })
    }

    // Map to channel status format
    const channels = credentials.map((cred: any) => ({
      channel: cred.channel_type,
      connected: cred.is_connected,
      email: cred.metadata?.email,
      phoneNumber: cred.metadata?.phone_number,
      botUsername: cred.metadata?.bot_username,
    }))

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Error fetching channel status:', error)
    return NextResponse.json({ channels: [] })
  }
}
