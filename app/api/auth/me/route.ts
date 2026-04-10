import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  const payload = verifySessionToken(token)
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
  return NextResponse.json({
    user: { id: payload.sub, email: payload.email, name: payload.name ?? null },
  })
}
