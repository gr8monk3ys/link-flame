import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resolveWebhookSecret } from '@/lib/stripe-webhook-secret'

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

const DEDICATED = 'STRIPE_BILLING_WEBHOOK_SECRET'

describe('resolveWebhookSecret', () => {
  const original = { ...process.env }

  beforeEach(() => {
    delete process.env[DEDICATED]
    delete process.env.STRIPE_WEBHOOK_SECRET
  })

  afterEach(() => {
    process.env = { ...original }
  })

  it('prefers the route\'s own secret', () => {
    vi.stubEnv('NODE_ENV', 'production')
    process.env[DEDICATED] = 'whsec_dedicated'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_shared'

    expect(resolveWebhookSecret(DEDICATED)).toBe('whsec_dedicated')
  })

  it('refuses the shared secret in production', () => {
    // The point of the change: one leaked secret must not be enough to forge
    // events against every webhook route.
    vi.stubEnv('NODE_ENV', 'production')
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_shared'

    expect(() => resolveWebhookSecret(DEDICATED)).toThrow(/Missing STRIPE_BILLING_WEBHOOK_SECRET/)
    expect(() => resolveWebhookSecret(DEDICATED)).toThrow(/refused in production/)
  })

  it('still allows the shared secret in development', () => {
    // `stripe listen` forwards to several paths under one secret locally.
    vi.stubEnv('NODE_ENV', 'development')
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_shared'

    expect(resolveWebhookSecret(DEDICATED)).toBe('whsec_shared')
  })

  it('throws when nothing is configured at all', () => {
    vi.stubEnv('NODE_ENV', 'development')

    expect(() => resolveWebhookSecret(DEDICATED)).toThrow(/Missing/)
  })
})
