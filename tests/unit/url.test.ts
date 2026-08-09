import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getBaseUrl } from '@/lib/url'

const URL_VARS = [
  'NEXT_PUBLIC_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_VERCEL_URL',
  'VERCEL_PROJECT_PRODUCTION_URL',
  'VERCEL_URL',
  'NEXTAUTH_URL',
]

describe('getBaseUrl', () => {
  const original = { ...process.env }

  beforeEach(() => {
    for (const name of URL_VARS) delete process.env[name]
  })

  afterEach(() => {
    process.env = { ...original }
  })

  it('never returns localhost outside development', () => {
    // The bug this guards: a production build with no URL variables set was
    // writing http://localhost:3000/og.png into its own metadata.
    vi.stubEnv('NODE_ENV', 'production')
    expect(getBaseUrl()).not.toContain('localhost')
  })

  it('does not leak localhost when NODE_ENV is unset or unexpected', () => {
    vi.stubEnv('NODE_ENV', 'test')
    expect(getBaseUrl()).not.toContain('localhost')
  })

  it('uses localhost only in development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(getBaseUrl()).toBe('http://localhost:3000')
  })

  it('derives an https origin from the Vercel host', () => {
    vi.stubEnv('NODE_ENV', 'production')
    process.env.NEXT_PUBLIC_VERCEL_URL = 'link-flame.vercel.app'
    expect(getBaseUrl()).toBe('https://link-flame.vercel.app')
  })

  it('prefers an explicit public URL over everything else', () => {
    vi.stubEnv('NODE_ENV', 'production')
    process.env.NEXT_PUBLIC_URL = 'https://linkflame.com'
    process.env.NEXT_PUBLIC_VERCEL_URL = 'preview.vercel.app'
    process.env.NEXTAUTH_URL = 'http://localhost:4010'
    expect(getBaseUrl()).toBe('https://linkflame.com')
  })
})
