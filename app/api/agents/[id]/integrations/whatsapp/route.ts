import { NextRequest, NextResponse } from 'next/server'
import { resolveAuthIdentity } from '@/lib/auth/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { saveAgentCredentials } from '@/lib/supabase/credentials'

export const runtime = 'nodejs'

interface WhatsAppIntegrationRequest {
  phone_number_id: string
  api_token: string
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await resolveAuthIdentity(req)
    const { id: agentId } = await params
    const body = (await req.json()) as WhatsAppIntegrationRequest

    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phone_number_id, api_token } = body

    if (!phone_number_id || !api_token) {
      return NextResponse.json(
        { error: 'Missing required fields: phone_number_id, api_token' },
        { status: 400 }
      )
    }

    const supabase = supabaseAdmin

    // Resolve Supabase UUID from Clerk ID
    const { data: userRow } = await (supabase.from('users') as any)
      .select('id')
      .eq('clerk_id', identity.externalUserId)
      .single()

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify agent ownership
    const { data: agent, error: agentError } = await (supabase.from('agents') as any)
      .select('*')
      .eq('id', agentId)
      .eq('user_id', userRow.id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Update agent with WhatsApp phone number ID (stored unencrypted for quick lookup)
    const { error: updateError } = await (supabase.from('agents') as any)
      .update({
        whatsapp_phone_number_id: phone_number_id,
        channels_whatsapp: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
    }

    // Save API token encrypted in credentials vault
    const credResult = await saveAgentCredentials(userRow.id, agentId, {
      whatsapp_api_token: api_token,
    })

    if (!credResult.success) {
      return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 })
    }

    // Test the WhatsApp API connection
    const testResult = await testWhatsAppConnection(phone_number_id, api_token)
    if (!testResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid WhatsApp credentials. Connection test failed.',
          details: testResult.error,
        },
        { status: 400 }
      )
    }

    // Log activity
    await (supabase.from('activity_logs') as any).insert({
      user_id: userRow.id,
      agent_id: agentId,
      action: 'whatsapp_integrated',
      details: {
        phone_number_id,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'WhatsApp integrated successfully',
      agent: {
        id: agent.id,
        channels_whatsapp: true,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/**
 * Test WhatsApp API connection by fetching phone number info
 */
async function testWhatsAppConnection(
  phoneNumberId: string,
  apiToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${phoneNumberId}?fields=id,display_phone_number,quality_rating`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return {
        success: false,
        error: `WhatsApp API error: ${error}`,
      }
    }

    await response.json()

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Connection test failed: ${String(error)}`,
    }
  }
}
