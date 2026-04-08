
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { createSessionToken, verifyPassword } from '@/lib/auth/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string
      password?: string
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const { data: account, error } = await (supabaseAdmin.from('auth_accounts') as any)
      .select('email, password_hash, external_user_id, full_name')
      .eq('email', normalizedEmail)
      .single()

    if (error?.code === '42P01') {
      return NextResponse.json(
        {
          error:
            'Auth tables are not initialized. Run Supabase migrations (including 02_auth_and_runtime_tables.sql) and retry.',
        },
        { status: 503 }
      )
    }

    if (error || !account || !verifyPassword(password, account.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = createSessionToken({
      sub: account.external_user_id,
      email: account.email,
      name: account.full_name || undefined,
    })

    // Send welcome email
    fetch(`${req.nextUrl.origin}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: account.email,
        subject: 'Welcome back to diyaa.ai',
        html: `<h1>Official Login Confirmation</h1><p>You logged in successfully. Your AI team awaits!</p>`,
      }),
    }).catch(console.error)

    return NextResponse.json({
      token,
      user: {
        id: account.external_user_id,
        email: account.email,
        name: account.full_name || null,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
