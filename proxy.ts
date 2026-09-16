import NextAuth from 'next-auth'
import authConfig from '@/auth.config'
import { NextResponse } from 'next/server'
import { buildCspHeader, routeUsesNonce } from '@/lib/csp'

const { auth } = NextAuth(authConfig)

// Generate a unique request ID for correlating logs across services.
function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

/**
 * Generate a cryptographically secure nonce for CSP.
 * Uses Web Crypto API available in Edge Runtime.
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const value of bytes) binary += String.fromCharCode(value)
  return btoa(binary)
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const requestId = req.headers.get('x-request-id') || generateRequestId()
  // A nonce forces per-request rendering (Next.js stamps it on every script
  // at render time), so only routes that carry a session, cart or payment get
  // one. Everything else is served with the static policy from lib/csp.ts and
  // can be prerendered. See lib/csp.ts.
  const nonce = routeUsesNonce(pathname) ? generateNonce() : undefined

  // Protected routes that require authentication.
  // Note: `/checkout` is intentionally *not* protected to support guest checkout.
  // Billing pages handle unauthenticated users by rendering a sign-in CTA.
  const protectedRoutes = ['/account', '/admin']
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !isLoggedIn) {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    const response = NextResponse.redirect(signInUrl)
    response.headers.set('x-request-id', requestId)
    return response
  }

  // Propagate request-scoped headers to the app.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-request-id', requestId)
  if (nonce) requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set('x-request-id', requestId)
  if (nonce) response.headers.set('x-nonce', nonce)
  response.headers.set('Content-Security-Policy', buildCspHeader(nonce))

  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes.
    '/(api|trpc)(.*)',
  ],
}
