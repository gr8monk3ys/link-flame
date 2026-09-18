const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Inlined into the browser bundle at build time so lib/sentry-enabled.ts can
  // tell a deploy from a laptop on the client too. Vercel only guarantees the
  // unprefixed VERCEL_ENV; whether NEXT_PUBLIC_VERCEL_ENV reaches the client
  // depends on a per-project "expose system environment variables" setting, so
  // this derives it here instead of depending on that setting being on. Empty
  // string anywhere Vercel is not building, which is what closes the gate.
  env: {
    NEXT_PUBLIC_VERCEL_ENV:
      process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || '',
  },
  images: {
    // Use remotePatterns instead of domains (more secure and flexible)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // OAuth provider avatars
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/**',
      },
      // Gravatar for fallback avatars
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        pathname: '/**',
      },
    ],
    // Enable modern image formats for better compression and quality
    formats: ['image/avif', 'image/webp'],
    // Define device sizes for responsive images (tailwind breakpoints)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Define image sizes for different layout widths
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimized images for 24 hours (86400 seconds)
    // Images rarely change and this saves bandwidth/processing
    minimumCacheTTL: 86400,
    // Disable static image imports optimization if causing issues
    // dangerouslyAllowSVG: true, // Enable if you need to serve SVGs through next/image
    // contentDispositionType: 'attachment', // Force download for untrusted content
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
    // Inline the global stylesheet into the document instead of linking it.
    // Measured through an HTTP/2 proxy with Lighthouse mobile throttling: the
    // 21 KB render-blocking stylesheet was requested at 0.6 s and finished
    // last at 2.6 s, behind ~19 script chunks and the hero image that share
    // the same multiplexed connection, so first paint waited on the slowest
    // stream. With the CSS in the HTML, first paint needs nothing but the
    // document (FCP 2.67 s -> 0.93 s, Lighthouse 92 -> 100). Cost: Next
    // repeats the CSS in the RSC payload, so the home document carries three
    // copies and grew from 27 KB to 98 KB gzipped. style-src already allows
    // 'unsafe-inline' (lib/csp.ts), so no CSP change is needed.
    inlineCss: true,
  },
  turbopack: {
    // Pin Turbopack root to this workspace to avoid monorepo lockfile ambiguity warnings.
    root: __dirname,
  },

  // Security Headers - Production Ready Configuration
  async headers() {
    // Content Security Policy
    // Note: 'unsafe-inline' and 'unsafe-eval' are required for Next.js development
    // Consider using nonces or hashes in production for stricter CSP
    // CSP is handled by proxy.ts.
    // Only non-CSP security headers are set here to avoid conflicting dual CSP headers.

    return [
      // Cache static assets aggressively
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Next.js already serves /_next/static with exactly this header in
      // production, so this entry only ever mattered in development - where it
      // is actively harmful. Turbopack reuses a chunk URL while its contents
      // change, and `immutable` tells the browser never to revalidate, so edits
      // to CSS silently do not reach the page. That is what "Custom
      // Cache-Control headers detected ... can break Next.js development
      // behavior" in the dev server banner is warning about.
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/_next/static/:path*',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=31536000, immutable',
                },
              ],
            },
          ]
        : []),
      // Cache public API responses at CDN level
      {
        source: '/api/products',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=1800, stale-while-revalidate=3600',
          },
        ],
      },
      {
        source: '/api/products/categories',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        ],
      },
      {
        source: '/api/products/price-ranges',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        ],
      },
      {
        source: '/api/blog/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        ],
      },
      // Security headers for all routes
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '0'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)'
          },
        ],
      },
    ];
  },
}

const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
})
