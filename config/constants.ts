/**
 * Application-wide constants
 *
 * This file contains hardcoded values used throughout the application
 * to ensure consistency and make updates easier.
 */

/**
 * Currency configuration
 */
export const CURRENCY = {
  code: 'USD',
  symbol: '$',
  locale: 'en-US',
} as const

/**
 * Format a price value according to the application's currency settings
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
  }).format(amount)
}

/**
 * Contact information
 */
export const CONTACT = {
  email: 'hello@linkflame.com',
  supportEmail: 'support@linkflame.com',
  businessEmail: 'business@linkflame.com',
  pressEmail: 'press@linkflame.com',
} as const

/**
 * Social media links
 */
export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/linkflame',
  instagram: 'https://instagram.com/linkflame',
  pinterest: 'https://pinterest.com/linkflame',
  github: 'https://github.com/gr8monk3ys/link-flame',
} as const

/**
 * Application limits and thresholds
 */
export const LIMITS = {
  // Cart
  maxCartItems: 50,
  minCheckoutAmount: 0,
  freeShippingThreshold: 35,

  // Pagination
  defaultPageSize: 12,
  maxPageSize: 100,

  // Input lengths
  maxProductTitleLength: 200,
  maxDescriptionLength: 2000,
  maxCommentLength: 500,

  // Rate limiting
  rateLimitWindow: 60 * 1000, // 1 minute in milliseconds
  maxRequestsPerWindow: 100,
} as const

/**
 * Feature flags
 * Simple boolean flags to enable/disable features
 */
export const FEATURES = {
  enableWishlist: false,
  enableProductReviews: false,
  enableNewsletter: true,
  enableBlog: true,
  enableContactForm: true,
} as const

/**
 * API configuration
 */
export const API = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 30000, // 30 seconds
} as const

/**
 * SEO defaults
 */
export const SEO = {
  siteName: 'Link Flame',
  siteDescription: 'Your trusted source for eco-friendly living and sustainable product recommendations.',
  defaultOgImage: '/images/og-default.jpg',
} as const

/**
 * Date formatting
 */
export const DATE_FORMATS = {
  short: 'MMM d, yyyy',
  long: 'MMMM d, yyyy',
  withTime: 'MMM d, yyyy h:mm a',
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const
