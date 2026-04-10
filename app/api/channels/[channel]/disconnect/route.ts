import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { resolveAuthIdentity } from '@/lib/auth/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { channel: string } }) {
  try {
    const identity = await resolveAuthIdentity(req)
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channel = params.channel
    const agentId = req.nextUrl.searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 })
    }

    // Delete channel credentials
    const { error } = await (supabaseAdmin.from('channel_credentials') as any)
      .delete()
      .eq('user_id', identity.supabaseUserId)
      .eq('agent_id', agentId)
      .eq('channel_type', channel)

    if (error) {
      console.error('Failed to disconnect channel:', error)
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting channel:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
