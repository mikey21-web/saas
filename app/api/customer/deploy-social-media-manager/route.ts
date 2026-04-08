/**
 * Customer Deploy Social Media Manager
 *
 * POST /api/customer/deploy-social-media-manager
 *
 * Customer sends:
 * {
 *   "action": "setup_instagram|setup_twitter|setup_linkedin|setup_facebook|setup_tiktok|deploy|status",
 *   "credentials": { ... platform credentials ... }
 * }
 *
 * Returns:
 * {
 *   "success": true/false,
 *   "message": "...",
 *   "data": { ... }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveAuthIdentity } from '@/lib/auth/server'
import {
  setupPlatformCredentials,
  getConnectedPlatforms,
  disconnectPlatform,
} from '@/lib/customer/credential-setup'
import { supabaseAdmin } from '@/lib/supabase/client'

export const runtime = 'nodejs'

interface DeployRequest {
  action:
    | 'setup_instagram'
    | 'setup_twitter'
    | 'setup_linkedin'
    | 'setup_facebook'
    | 'setup_tiktok'
    | 'deploy'
    | 'status'
    | 'disconnect'
  credentials?: Record<string, string>
  platform?: string
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const jwtIdentity = await resolveAuthIdentity(request)
    const userId = jwtIdentity?.supabaseUserId || jwtIdentity?.externalUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as DeployRequest
    const { action, credentials, platform } = body

    // ─────────────────────────────────────────────────────────────────────
    // ACTION: Setup Platform Credentials
    // ─────────────────────────────────────────────────────────────────────

    if (action === 'setup_instagram') {
      const result = await setupPlatformCredentials({
        userId,
        platform: 'instagram',
        credentials: credentials || {},
      })
      return NextResponse.json(result)
    }

    if (action === 'setup_twitter') {
      const result = await setupPlatformCredentials({
        userId,
        platform: 'twitter',
        credentials: credentials || {},
      })
      return NextResponse.json(result)
    }

    if (action === 'setup_linkedin') {
      const result = await setupPlatformCredentials({
        userId,
        platform: 'linkedin',
        credentials: credentials || {},
      })
      return NextResponse.json(result)
    }

    if (action === 'setup_facebook') {
      const result = await setupPlatformCredentials({
        userId,
        platform: 'facebook',
        credentials: credentials || {},
      })
      return NextResponse.json(result)
    }

    if (action === 'setup_tiktok') {
      const result = await setupPlatformCredentials({
        userId,
        platform: 'tiktok',
        credentials: credentials || {},
      })
      return NextResponse.json(result)
    }

    // ─────────────────────────────────────────────────────────────────────
    // ACTION: Deploy Social Media Manager Agent
    // ─────────────────────────────────────────────────────────────────────

    if (action === 'deploy') {
      // Check if at least one platform is configured
      const connectedPlatforms = await getConnectedPlatforms(userId)

      if (connectedPlatforms.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Please connect at least one platform before deploying',
            data: { connectedPlatforms: [] },
          },
          { status: 400 }
        )
      }

      // Create/activate Social Media Manager agent for this user
      const { error } = await (supabaseAdmin.from('agents') as any).upsert({
        id: `smm-${userId}`,
        user_id: userId,
        name: 'Social Media Manager',
        type: 'social_media_manager',
        status: 'active',
        platforms: connectedPlatforms,
        config: {
          autoPost: true,
          scheduleOptimal: true,
          trackAnalytics: true,
          autoEngage: true,
        },
        created_at: new Date().toISOString(),
        deployed_at: new Date().toISOString(),
      })

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to deploy agent',
            error: error.message,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Social Media Manager deployed successfully! 🚀',
        data: {
          agentId: `smm-${userId}`,
          connectedPlatforms,
          status: 'active',
          deployedAt: new Date().toISOString(),
          nextSteps: [
            "Send WhatsApp: 'Create an Instagram post about AI trends'",
            "Agent will generate content and post automatically",
            "View analytics and engagement metrics",
          ],
        },
      })
    }

    // ─────────────────────────────────────────────────────────────────────
    // ACTION: Check Deployment Status
    // ─────────────────────────────────────────────────────────────────────

    if (action === 'status') {
      const { data: agent, error: agentError } = await (supabaseAdmin.from('agents') as any)
        .select('*')
        .eq('id', `smm-${userId}`)
        .eq('type', 'social_media_manager')
        .single()

      if (!agent) {
        // Get connected platforms even if agent not deployed
        const connectedPlatforms = await getConnectedPlatforms(userId)

        return NextResponse.json({
          success: true,
          data: {
            deployed: false,
            connectedPlatforms,
            message: 'Agent not yet deployed. Connect platforms and click Deploy.',
          },
        })
      }

      const connectedPlatforms = await getConnectedPlatforms(userId)

      return NextResponse.json({
        success: true,
        data: {
          deployed: true,
          agentId: agent.id,
          status: agent.status,
          connectedPlatforms,
          deployedAt: agent.deployed_at,
          config: agent.config,
        },
      })
    }

    // ─────────────────────────────────────────────────────────────────────
    // ACTION: Disconnect Platform
    // ─────────────────────────────────────────────────────────────────────

    if (action === 'disconnect') {
      if (!platform) {
        return NextResponse.json(
          { error: 'platform parameter required' },
          { status: 400 }
        )
      }

      const result = await disconnectPlatform(userId, platform)
      return NextResponse.json(result)
    }

    // Invalid action
    return NextResponse.json(
      {
        error: `Unknown action: ${action}`,
        availableActions: [
          'setup_instagram',
          'setup_twitter',
          'setup_linkedin',
          'setup_facebook',
          'setup_tiktok',
          'deploy',
          'status',
          'disconnect',
        ],
      },
      { status: 400 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Deploy SMM] Error:', message)

    return NextResponse.json(
      {
        success: false,
        message: `Deployment failed: ${message}`,
        error: message,
      },
      { status: 500 }
    )
  }
}
