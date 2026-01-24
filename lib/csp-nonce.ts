/**
 * CSP Nonce Generation Utility
 *
 * Generates cryptographically secure nonces for Content Security Policy.
 * Nonces are used to allow specific inline scripts while blocking others.
 *
 * **How it works:**
 * 1. Middleware generates a nonce for each request
 * 2. Nonce is passed to the page via headers
 * 3. Scripts include the nonce attribute
 * 4. CSP policy only allows scripts with matching nonce
 *
 * **Usage in components:**
 * ```tsx
 * import { headers } from 'next/headers'
 *
 * export default async function Page() {
 *   const nonce = (await headers()).get('x-nonce') || ''
 *   return <Script nonce={nonce} src="/script.js" />
 * }
 * ```
 */

import { randomBytes } from 'crypto'

/**
 * Generate a cryptographically secure nonce
 * Returns a base64-encoded 16-byte random string
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64')
}

/**
 * Build CSP header with nonce support
 * @param nonce - The generated nonce for this request
 * @param isDevelopment - Whether in development mode (more permissive)
 */
export function buildCspHeader(nonce: string, isDevelopment: boolean = false): string {
  // In development, we need to be more permissive for HMR and dev tools
  const scriptSrc = isDevelopment
    ? `'self' 'unsafe-eval' 'unsafe-inline'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`

  const styleSrc = isDevelopment
    ? `'self' 'unsafe-inline' https://fonts.googleapis.com`
    : `'self' 'nonce-${nonce}' https://fonts.googleapis.com`

  // Build the CSP directives
  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc} https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com`,
    `style-src ${styleSrc}`,
    `img-src 'self' https://images.unsplash.com https://img.clerk.com https://*.stripe.com data: blob:`,
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

/**
 * CSP Report-Only header for testing
 * Use this to test stricter CSP without breaking functionality
 */
export function buildCspReportOnlyHeader(nonce: string): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    `img-src 'self' https://images.unsplash.com https://*.stripe.com data: blob:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://api.stripe.com`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
    `object-src 'none'`,
    `report-uri /api/csp-report`, // Endpoint to receive CSP violation reports
  ]

  return directives.join('; ')
}
