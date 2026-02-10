import { auth } from '@/auth'
import { NextResponse } from 'next/server'

// Generate a unique request ID
function generateRequestId(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older environments
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Generate a cryptographically secure nonce for CSP
 * Uses Web Crypto API available in Edge Runtime
 */
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

/**
 * Build CSP header with nonce support
 * @param nonce - The generated nonce for this request
 */
function buildCspHeader(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // In development, we need to be more permissive for HMR and dev tools
  const scriptSrc = isDevelopment
    ? `'self' 'unsafe-eval' 'unsafe-inline'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com`

  const styleSrc = isDevelopment
    ? `'self' 'unsafe-inline' https://fonts.googleapis.com`
    : `'self' 'unsafe-inline' https://fonts.googleapis.com` // Styles still need unsafe-inline for CSS-in-JS

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

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Generate request ID and CSP nonce
  const requestId = req.headers.get('x-request-id') || generateRequestId()
  const nonce = generateNonce()

  // Protected routes that require authentication
  const protectedRoutes = ['/account', '/checkout', '/admin']
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Redirect to sign-in if accessing protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    const response = NextResponse.redirect(signInUrl)
    response.headers.set('x-request-id', requestId)
    return response
  }

  // Clone the request headers and add request ID and nonce
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-request-id', requestId)
  requestHeaders.set('x-nonce', nonce) // Pass nonce to page components

  // Create response with headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Set response headers
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-nonce', nonce)

  // Set CSP header (with nonce in production)
  const cspHeader = buildCspHeader(nonce)
  response.headers.set('Content-Security-Policy', cspHeader)

  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}