import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * Mock Payment Simulator
 * Simulates payment webhooks from Razorpay/Stripe without real payment processors
 * Used for testing payment flows in development
 */
export async function POST(req: NextRequest) {
  try {
    const { agentId, userId, provider } = await req.json()

    if (!agentId || !userId || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, userId, provider' },
        { status: 400 }
      )
    }

    // Verify agent exists
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('id, status')
      .eq('id', agentId)
      .eq('user_id', userId)
      .single()

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Update agent status to active
    const { error: updateError } = await ((supabaseAdmin as any)
      .from('agents')
      .update({
        status: 'active',
        deployed_at: new Date().toISOString(),
      })
      .eq('id', agentId)
      .eq('user_id', userId)) as any

    if (updateError) {
      return NextResponse.json(
        { error: `Update failed: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Log payment activity
    const paymentId = `mock_${provider}_${Date.now()}`
    const { error: logError } = await ((supabaseAdmin as any)
      .from('activity_logs')
      .insert({
        user_id: userId,
        agent_id: agentId,
        action: 'payment_received',
        details: {
          paymentId,
          provider,
          status: 'success',
          mock: true,
          timestamp: new Date().toISOString(),
        },
      })) as any

    if (logError) {
      console.warn('Activity log failed:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `Mock ${provider} payment processed`,
      agentId,
      userId,
      paymentId,
      newStatus: 'active',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Mock payment error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
