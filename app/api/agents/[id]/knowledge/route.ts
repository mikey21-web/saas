import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveAuthIdentity } from '@/lib/auth/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/agents/[id]/knowledge — list all knowledge docs for agent
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await resolveAuthIdentity(_request)
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', identity.supabaseUserId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const { data: docs, error } = await supabaseAdmin
      .from('knowledge_documents')
      .select('id, title, source, file_name, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch knowledge docs' }, { status: 500 })
    }

    return NextResponse.json({ documents: docs || [] })
  } catch (error) {
    console.error('Knowledge GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/agents/[id]/knowledge — upload text or file content
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await resolveAuthIdentity(request)
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params

    // Verify agent belongs to user
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', identity.supabaseUserId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const contentType = request.headers.get('content-type') || ''

    let title = 'Untitled Document'
    let content = ''
    let source = 'text'
    let fileName: string | null = null

    if (contentType.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const textContent = formData.get('content') as string | null
      title = (formData.get('title') as string) || 'Untitled Document'

      if (file) {
        fileName = file.name
        source = 'file'
        content = await file.text()
        if (!title || title === 'Untitled Document') {
          title = file.name.replace(/\.[^/.]+$/, '')
        }
      } else if (textContent) {
        content = textContent
        source = 'text'
      }
    } else {
      // JSON body
      const body = (await request.json()) as { title?: string; content: string; source?: string }
      title = body.title || 'Untitled Document'
      content = body.content
      source = body.source || 'text'
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Content too short (minimum 10 characters)' },
        { status: 400 }
      )
    }

    // Chunk large content (max 2000 chars per doc for clean RAG retrieval)
    const CHUNK_SIZE = 2000
    const chunks: string[] = []

    if (content.length <= CHUNK_SIZE) {
      chunks.push(content.trim())
    } else {
      // Split by paragraphs first, then by size
      const paragraphs = content.split(/\n\n+/)
      let currentChunk = ''

      for (const para of paragraphs) {
        if ((currentChunk + '\n\n' + para).length > CHUNK_SIZE && currentChunk) {
          chunks.push(currentChunk.trim())
          currentChunk = para
        } else {
          currentChunk = currentChunk ? currentChunk + '\n\n' + para : para
        }
      }
      if (currentChunk.trim()) chunks.push(currentChunk.trim())
    }

    // Insert all chunks
    const inserts = chunks.map((chunk, i) => ({
      agent_id: agentId,
      user_id: identity.supabaseUserId,
      title: chunks.length > 1 ? `${title} (Part ${i + 1})` : title,
      content: chunk,
      source,
      file_name: fileName,
    }))

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('knowledge_documents')
      .insert(inserts)
      .select('id, title, created_at')

    if (insertError) {
      console.error('Knowledge insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save knowledge document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      documents: inserted,
      chunksCreated: chunks.length,
    })
  } catch (error) {
    console.error('Knowledge POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/agents/[id]/knowledge?docId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await resolveAuthIdentity(request)
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: agentId } = await params
    const docId = request.nextUrl.searchParams.get('docId')

    if (!docId) {
      return NextResponse.json({ error: 'docId required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('knowledge_documents')
      .delete()
      .eq('id', docId)
      .eq('agent_id', agentId)
      .eq('user_id', identity.supabaseUserId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Knowledge DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
