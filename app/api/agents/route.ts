import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'

// Use Node.js runtime (Clerk uses MessageChannel which isn't supported in Edge Runtime)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      name,
      businessName,
      industry,
      products,
      knowledgeBase,
      tone,
      activeHours,
      channels,
      modelTier,
    } = await request.json()

    // TODO: Save to Supabase
    // This is a placeholder API response
    const agent = {
      id: `agent_${Date.now()}`,
      userId,
      name,
      businessName,
      industry,
      products,
      knowledgeBase,
      tone,
      activeHours,
      channels,
      modelTier,
      status: 'active',
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Agent creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}
