const withMDX = require('@next/mdx')()

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
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**',
      },
    ],
    // Enable modern image formats for better compression and quality
    formats: ['image/avif', 'image/webp'],
    // Define device sizes for responsive images (tailwind breakpoints)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Define image sizes for different layout widths
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize motion for accessibility
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds (default)
    // Disable static image imports optimization if causing issues
    // dangerouslyAllowSVG: true, // Enable if you need to serve SVGs through next/image
    // contentDispositionType: 'attachment', // Force download for untrusted content
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  eslint: {
    dirs: ['app', 'components', 'lib', 'types', 'hooks', 'config', 'styles', 'public'],
  },
}

module.exports = withMDX(nextConfig)
