import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/client'
import { createSessionToken } from '@/lib/auth/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error_description') || searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(errorParam)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=${encodeURIComponent(error?.message || 'auth_failed')}`
    )
  }

  const user = data.user
  const email = (user.email || '').trim().toLowerCase()
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    null

  if (!email) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_email`)
  }

  const externalUserId = `google:${user.id}`

  // Upsert into auth_accounts so downstream APIs see the user
  try {
    const { data: existing } = await (supabaseAdmin.from('auth_accounts') as any)
      .select('id, external_user_id')
      .eq('email', email)
      .maybeSingle()

    if (!existing) {
      await (supabaseAdmin.from('auth_accounts') as any).insert({
        email,
        password_hash: 'oauth:google',
        external_user_id: externalUserId,
        full_name: fullName,
      })
    }
  } catch (err) {
    // If auth_accounts table doesn't exist, continue — JWT still works for middleware
    console.error('auth_accounts upsert skipped:', err)
  }

  const token = createSessionToken({
    sub: externalUserId,
    email,
    name: fullName || undefined,
  })

  const response = NextResponse.redirect(`${origin}/agents`)
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
  return response
}
