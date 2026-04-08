import { NextRequest, NextResponse } from 'next/server'
import { crawlWebsite } from '@/lib/agents/website-crawler'
import { resolveAuthIdentity } from '@/lib/auth/server'

export const runtime = 'nodejs'

/**
 * API endpoint to crawl a website and extract knowledge
 *
 * POST /api/agents/[id]/crawl
 * Body: { url: "https://example.com" }
 */
export async function POST(req: NextRequest) {
  const jwtIdentity = await resolveAuthIdentity(req)
  if (!jwtIdentity?.supabaseUserId && !jwtIdentity?.externalUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const result = await crawlWebsite(url)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to crawl website' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      title: result.title,
      description: result.description,
      sections: result.sections,
      contactInfo: result.contactInfo,
      faqs: result.faqs,
      extractedText: result.extractedText.slice(0, 5000), // Limit stored text
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
