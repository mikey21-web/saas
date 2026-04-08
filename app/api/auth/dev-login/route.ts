import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'

function makeToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

export const runtime = 'nodejs'

export async function GET() {
  try {
    const token = makeToken({
      userId: 'dev-user-123',
      email: 'dev@diyaa.ai',
      name: 'Dev User',
      role: 'super_admin',
    })

    const response = NextResponse.json({ success: true, token })
    response.cookies.set('auth_token', token, {
      httpOnly: false, // Allow JS to read it too
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
