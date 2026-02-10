const withMDX = require('@next/mdx')()
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
  turbopack: {},
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],

  // Security Headers - Production Ready Configuration
  async headers() {
    // Content Security Policy
    // Note: 'unsafe-inline' and 'unsafe-eval' are required for Next.js development
    // Consider using nonces or hashes in production for stricter CSP
    // CSP is handled by middleware.ts with proper nonce-based policy for production.
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
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
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

const wrappedConfig = withBundleAnalyzer(withMDX(nextConfig))

module.exports = wrappedConfig
