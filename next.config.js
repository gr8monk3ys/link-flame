const withMDX = require('@next/mdx')()

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // `images.domains` is deprecated in Next 15; remotePatterns is the replacement.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  // next-mdx-remote is on Next's default server-externals list, so its
  // require('react/jsx-runtime') would load the project's React 18 instead
  // of the React that the App Router bundles, and rendering fails with
  // "A React Element from an older version of React was rendered".
  // Bundling it makes it share the App Router's React.
  transpilePackages: ['next-mdx-remote'],
}

module.exports = withMDX(nextConfig)
