import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || process.env.ENCRYPTION_KEY || 'change-me-in-production'

const PROTECTED_PREFIXES = [
  '/agents',
  '/store',
  '/office',
  '/inbox',
  '/billing',
  '/settings',
  '/workflows',
  '/projects',
  '/analytics',
  '/contacts',
  '/create-agent',
  '/identity',
  '/skills',
  '/onboard',
  '/academy',
  '/checkout',
  '/dashboard',
]

interface SessionPayload {
  sub: string
  email: string
  name?: string
  exp: number
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const padLen = (4 - (padded.length % 4)) % 4
  return atob(padded + '='.repeat(padLen))
}

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function verifySessionTokenEdge(token: string): Promise<SessionPayload | null> {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuf = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(encodedPayload)
  )
  const expected = base64UrlEncode(new Uint8Array(sigBuf))

  if (expected.length !== signature.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  if (diff !== 0) return null

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload
    if (!payload.sub || !payload.email || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always let the OAuth callback through so it can set the cookie
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  // Legacy sign-up route → send users to sign-in (Google only)
  if (pathname.startsWith('/sign-up') || pathname === '/auth/sign-up') {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Legacy /auth/sign-in → /sign-in
  if (pathname === '/auth/sign-in') {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (!token) {
    if (isProtected) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
    return NextResponse.next()
  }

  const payload = await verifySessionTokenEdge(token)
  if (!payload) {
    if (isProtected) {
      const response = NextResponse.redirect(new URL('/sign-in', request.url))
      response.cookies.delete('auth_token')
      return response
    }
    return NextResponse.next()
  }

  // Already signed in: bounce away from auth pages
  if (pathname === '/sign-in' || pathname === '/auth/sign-in') {
    return NextResponse.redirect(new URL('/agents', request.url))
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.sub)
  requestHeaders.set('x-user-email', payload.email)
  requestHeaders.set('x-user-name', payload.name || '')

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
