import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simplified middleware that allows all public routes
// Clerk integration handled client-side instead
export function middleware(request: NextRequest) {
  // Allow all requests through - auth is handled client-side via Clerk
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)'],
}
