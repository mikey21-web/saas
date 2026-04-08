import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 })
    }

    // Verify OTP with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
    }

    // Create/update user profile in public.users table
    if (data.user) {
      const { error: profileError } = await (supabaseAdmin.from('users') as any)
        .upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || 'User',
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json({ error: 'OTP verification failed' }, { status: 500 })
  }
}
