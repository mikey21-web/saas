import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: [
    '/',
    '/landing(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/(.*)',
    '/api/test-driven-development(.*)',
    '/api/webapp-testing(.*)',
    '/test-driven-development(.*)',
    '/webapp-testing(.*)',
  ],
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)'],
}
