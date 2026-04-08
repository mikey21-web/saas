import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getSession()

  // Get the user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname

  // Public paths (no auth required)
  const publicPaths = ['/auth/sign-in', '/auth/sign-up', '/auth/callback', '/']

  // Never intercept the callback page — let Supabase handle the OAuth token
  if (pathname.startsWith('/auth/callback')) {
    return res
  }

  // If user is on auth pages but already logged in, redirect to dashboard
  if (user && publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // If user is NOT logged in and trying to access protected routes, redirect to sign in
  const protectedPaths = ['/dashboard', '/agents', '/workflows', '/settings', '/store', '/contacts', '/billing', '/inbox', '/office', '/onboard']
  if (!user && protectedPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/auth/sign-in', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
