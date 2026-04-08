import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireSuperAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const userId = requireAuth(request)
  if (!userId || !(await requireSuperAdmin(userId))) {
    return NextResponse.json({ error: 'Super admin required' }, { status: 403 })
  }

  const supabase = createClient() as any
  const url = new URL(request.url)
  const query = url.searchParams.get('query') || ''

  let queryBuilder = supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      role,
      created_at,
      agents_count,
      mrr
    `)

  if (query) {
    queryBuilder = queryBuilder.ilike('email', `%${query}%`)
  }

  const { data, error } = await queryBuilder.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json(data)
}

