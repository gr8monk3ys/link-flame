import NextAuth from 'next-auth'
import authConfig from '@/auth.config'
import { NextResponse } from 'next/server'

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

/**
 * Build CSP header. We keep this reasonably strict while still allowing Next.js
 * to work without wiring nonces into every script tag.
 *
 * TODO: tighten `script-src` by removing `'unsafe-inline'` once we pass a nonce
 * through to all scripts that need it.
 */
function buildCspHeader(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const scriptSrc = isDevelopment
    ? `'self' 'unsafe-eval' 'unsafe-inline'`
    : `'self' 'unsafe-inline' 'nonce-${nonce}' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com`

  const styleSrc = isDevelopment
    ? `'self' 'unsafe-inline' https://fonts.googleapis.com`
    : `'self' 'unsafe-inline' https://fonts.googleapis.com`

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src 'self' https://images.unsplash.com https://*.stripe.com data: blob:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://analytics.google.com`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ]

  return directives.join('; ')
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const requestId = req.headers.get('x-request-id') || generateRequestId()
  const nonce = generateNonce()

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
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set('x-request-id', requestId)
  response.headers.set('x-nonce', nonce)
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
