/**
 * Content Security Policy, shared by proxy.ts (Edge) and the unit tests.
 *
 * Two script-src modes:
 *
 * - `nonce`: per-request nonce + 'strict-dynamic'. Next.js reads the nonce
 *   from the CSP header and stamps it on every script it emits, which only
 *   works when the page is rendered per request. Used on the routes below,
 *   where a session, a cart, or a payment is on the page.
 *
 * - `static`: 'self' 'unsafe-inline' + the host allowlist, no nonce. Used for
 *   everything else, so marketing and catalogue pages can be prerendered at
 *   build time and served from the CDN. The home page took 4.3 s to arrive on
 *   a serverless cold start when the nonce forced it to render per request.
 *
 * The inline scripts the root layout renders on every page (next-themes'
 * colour-scheme script and the announcement bar's dismissal script) are
 * allowlisted by SHA-256 hash so they run under the nonce policy too, without
 * the layout reading request headers (which would make every route dynamic).
 * `tests/unit/csp.test.tsx` renders both scripts and checks the hashes.
 */

/** Route prefixes that keep the per-request nonce policy. */
export const NONCE_ROUTE_PREFIXES = [
  '/account',
  '/admin',
  '/auth',
  '/cart',
  '/checkout',
  '/order-confirmation',
  '/wishlists',
] as const

export function routeUsesNonce(pathname: string): boolean {
  return NONCE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/**
 * SHA-256 hashes of the two inline scripts the root layout renders on every
 * page. Regenerate with `npx vitest run tests/unit/csp.test.tsx` after
 * changing either script (the test prints the expected value on mismatch).
 */
export const INLINE_SCRIPT_HASHES = {
  /** next-themes pre-paint script for the props used in app/layout.tsx. */
  theme: 'sha256-X9GtzORyUShRgrb5vBVwF3p8WtKom3jBuMyocEhfL3Q=',
  /** components/announcement-bar.tsx PRE_PAINT_SCRIPT. */
  announcement: 'sha256-15G0KIjOAMbe0Q83Wvslttcp8G3DtxJeQLjAFEkdzgg=',
} as const

const SCRIPT_HOSTS =
  'https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com'

export function buildCspHeader(nonce?: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development'

  let scriptSrc: string
  if (isDevelopment) {
    scriptSrc = `'self' 'unsafe-eval' 'unsafe-inline'`
  } else if (nonce) {
    const hashes = Object.values(INLINE_SCRIPT_HASHES)
      .map((hash) => `'${hash}'`)
      .join(' ')
    scriptSrc = `'self' 'nonce-${nonce}' ${hashes} 'strict-dynamic' ${SCRIPT_HOSTS}`
  } else {
    scriptSrc = `'self' 'unsafe-inline' ${SCRIPT_HOSTS}`
  }

  const styleSrc = `'self' 'unsafe-inline' https://fonts.googleapis.com`

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src 'self' https://images.unsplash.com https://*.stripe.com data: blob:`,
    `font-src 'self' https://fonts.gstatic.com`,
    // Sentry's US-region ingest host is `<org>.ingest.us.sentry.io`, which
    // `*.ingest.sentry.io` does not match: the browser SDK loaded and every
    // envelope it sent was refused by this directive. Both spellings are kept
    // so a region change does not silently blind us again.
    `connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
    `manifest-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ]

  return directives.join('; ')
}
