import { NextResponse } from 'next/server'

// Temporary middleware — Clerk keys not yet configured
// Routes through without auth checks until keys are added
export function middleware() {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)'],
}
