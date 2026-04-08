import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { createSessionToken, hashPassword } from '@/lib/auth/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = (await req.json()) as {
      email?: string
      password?: string
      name?: string
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const externalUserId = `jwt:${normalizedEmail}`
    const passwordHash = hashPassword(password)

    const supabase = supabaseAdmin
    const { data: existing } = await (supabase.from('auth_accounts') as any)
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Account already exists' }, { status: 409 })
    }

    const { error: authError } = await (supabase.from('auth_accounts') as any).insert({
      email: normalizedEmail,
      password_hash: passwordHash,
      external_user_id: externalUserId,
      full_name: name || null,
    })

    if (authError) {
      if (authError.code === '42P01') {
        return NextResponse.json(
          {
            error:
              'Auth tables are not initialized. Run Supabase migrations (including 02_auth_and_runtime_tables.sql) and retry.',
          },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const token = createSessionToken({ sub: externalUserId, email: normalizedEmail, name })
    
    // Send welcome email
    await fetch(`${req.nextUrl.origin}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: normalizedEmail,
        subject: 'Welcome to diyaa.ai 👋',
        html: `
          <h1>Welcome ${name || 'there'}!</h1>
          <p>Your account is ready. Start hiring AI employees:</p>
          <a href="${req.nextUrl.origin}/dashboard" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Go to Dashboard</a>
        `,
      }),
    }).catch(console.error)

    return NextResponse.json({ token, user: { id: externalUserId, email: normalizedEmail, name } })
  } catch (error) {
    const message = String(error)
    if (message.includes("Could not find the table 'public.auth_accounts'")) {
      return NextResponse.json(
        {
          error:
            'Database schema missing auth_accounts. Apply Supabase migrations, then retry account creation.',
        },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
