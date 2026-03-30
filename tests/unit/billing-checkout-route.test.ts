import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getServerAuth: vi.fn(),
  validateCsrfToken: vi.fn(),
  checkStrictRateLimit: vi.fn(),
  getIdentifier: vi.fn(),
  membershipFindUnique: vi.fn(),
  getOrCreateStripeCustomer: vi.fn(),
  createCheckoutSession: vi.fn(),
  retrieveCheckoutSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getServerAuth: mocks.getServerAuth,
}))

vi.mock('@/lib/csrf', () => ({
  validateCsrfToken: mocks.validateCsrfToken,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkStrictRateLimit: mocks.checkStrictRateLimit,
  getIdentifier: mocks.getIdentifier,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    organizationMember: {
      findUnique: mocks.membershipFindUnique,
    },
  },
}))

vi.mock('@/lib/billing/subscription', () => ({
  createCheckoutSession: mocks.createCheckoutSession,
  getOrCreateStripeCustomer: mocks.getOrCreateStripeCustomer,
  SubscriptionError: class SubscriptionError extends Error {
    code: string

    constructor(message: string, code: string) {
      super(message)
      this.code = code
    }
  },
}))

vi.mock('@/lib/stripe-server', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: mocks.retrieveCheckoutSession,
      },
    },
  }),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

import { GET, POST } from '@/app/api/billing/checkout/route'

describe('Billing checkout route authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.getServerAuth.mockResolvedValue({
      userId: 'user_123',
      user: { id: 'user_123', name: 'Test Owner' },
      session: {},
    })
    mocks.validateCsrfToken.mockResolvedValue(true)
    mocks.checkStrictRateLimit.mockResolvedValue({
      success: true,
      reset: Date.now() + 10_000,
    })
    mocks.getIdentifier.mockReturnValue('user_123')
    mocks.membershipFindUnique.mockResolvedValue({ role: 'OWNER' })
    mocks.getOrCreateStripeCustomer.mockResolvedValue('cus_123')
    mocks.createCheckoutSession.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    })
    mocks.retrieveCheckoutSession.mockResolvedValue({
      id: 'cs_test_123',
      status: 'complete',
      payment_status: 'paid',
      customer_email: 'owner@example.com',
      metadata: {
        organizationId: 'org_123',
        planId: 'PRO',
        interval: 'monthly',
      },
      subscription: {
        id: 'sub_123',
        status: 'active',
        current_period_end: 1_735_689_600,
        trial_end: null,
        metadata: { organizationId: 'org_123' },
      },
      customer: {
        id: 'cus_123',
        email: 'owner@example.com',
        metadata: { organizationId: 'org_123' },
      },
    })
  })

  it('POST rejects users who are not members of the organization', async () => {
    mocks.membershipFindUnique.mockResolvedValueOnce(null)

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          planId: 'PRO',
          interval: 'monthly',
          organizationId: 'org_123',
          email: 'owner@example.com',
          name: 'Owner',
          enableTrial: true,
        }),
      })
    )

    const payload = await response.json()
    expect(response.status).toBe(403)
    expect(payload.success).toBe(false)
    expect(mocks.getOrCreateStripeCustomer).not.toHaveBeenCalled()
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled()
  })

  it('POST requires billing.manage permission', async () => {
    mocks.membershipFindUnique.mockResolvedValueOnce({ role: 'ADMIN' })

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          planId: 'PRO',
          interval: 'monthly',
          organizationId: 'org_123',
          email: 'owner@example.com',
          name: 'Owner',
          enableTrial: true,
        }),
      })
    )

    expect(response.status).toBe(403)
    expect(mocks.getOrCreateStripeCustomer).not.toHaveBeenCalled()
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled()
  })

  it('GET rejects sessions missing organization metadata', async () => {
    mocks.retrieveCheckoutSession.mockResolvedValueOnce({
      id: 'cs_test_123',
      status: 'complete',
      payment_status: 'paid',
      metadata: {},
      subscription: null,
      customer: null,
      customer_email: null,
    })

    const response = await GET(
      new Request('http://localhost/api/billing/checkout?session_id=cs_test_123')
    )

    expect(response.status).toBe(403)
    expect(mocks.membershipFindUnique).not.toHaveBeenCalled()
  })

  it('GET requires billing.read permission for the session organization', async () => {
    mocks.membershipFindUnique.mockResolvedValueOnce({ role: 'VIEWER' })

    const response = await GET(
      new Request('http://localhost/api/billing/checkout?session_id=cs_test_123')
    )

    expect(response.status).toBe(403)
  })

  it('GET returns checkout details for authorized organization member', async () => {
    const response = await GET(
      new Request('http://localhost/api/billing/checkout?session_id=cs_test_123')
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.planId).toBe('PRO')
    expect(payload.data.interval).toBe('monthly')
    expect(payload.data.subscription.id).toBe('sub_123')
  })
})
