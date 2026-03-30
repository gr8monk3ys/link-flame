import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  orgFindUnique: vi.fn(),
  orgUpdate: vi.fn(),
  subscriptionFindFirst: vi.fn(),
  subscriptionCreate: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findUnique: mocks.orgFindUnique,
      update: mocks.orgUpdate,
    },
    organizationSubscription: {
      findFirst: mocks.subscriptionFindFirst,
      create: mocks.subscriptionCreate,
    },
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

import type Stripe from 'stripe'
import { syncSubscriptionStatus } from '@/lib/billing/subscription'
import { SAAS_PLANS } from '@/lib/billing/plans'

describe('syncSubscriptionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.orgUpdate.mockResolvedValue({ id: 'org_123' })
    mocks.subscriptionFindFirst.mockResolvedValue(null)
    mocks.subscriptionCreate.mockResolvedValue({ id: 'org_sub_1' })
  })

  it('updates organization entitlements and writes a subscription snapshot', async () => {
    const stripeSubscription = {
      id: 'sub_123',
      status: 'active',
      metadata: { planId: 'PRO' },
      customer: 'cus_123',
      current_period_start: 1_700_000_000,
      current_period_end: 1_700_086_400,
      trial_end: null,
      trial_start: null,
      cancel_at: null,
      canceled_at: null,
      ended_at: null,
      items: {
        data: [
          {
            price: {
              id: 'price_pro_monthly',
              unit_amount: 7900,
              currency: 'usd',
              recurring: { interval: 'month' },
            },
          },
        ],
      },
    } as unknown as Stripe.Subscription

    await syncSubscriptionStatus('org_123', stripeSubscription)

    expect(mocks.orgUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'org_123' },
        data: expect.objectContaining({
          stripeCustomerId: 'cus_123',
          stripeSubscriptionId: 'sub_123',
          plan: 'PRO',
          billingInterval: 'monthly',
          subscriptionStatus: 'active',
          limitProducts: SAAS_PLANS.PRO.limits.products,
          limitOrders: SAAS_PLANS.PRO.limits.orders,
          limitTeamMembers: SAAS_PLANS.PRO.limits.teamMembers,
          limitStorageMB: SAAS_PLANS.PRO.limits.storageMB,
        }),
      })
    )

    expect(mocks.subscriptionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org_123',
          stripeSubscriptionId: 'sub_123',
          stripePriceId: 'price_pro_monthly',
          planId: 'PRO',
          billingInterval: 'monthly',
          status: 'active',
          amount: 79,
          currency: 'usd',
        }),
      })
    )
  })

  it('downgrades entitlements to FREE when subscription is canceled', async () => {
    const stripeSubscription = {
      id: 'sub_123',
      status: 'canceled',
      metadata: { planId: 'PRO' },
      customer: 'cus_123',
      current_period_start: 1_700_000_000,
      current_period_end: 1_700_086_400,
      trial_end: null,
      trial_start: null,
      cancel_at: null,
      canceled_at: 1_700_086_400,
      ended_at: 1_700_086_400,
      items: {
        data: [
          {
            price: {
              id: 'price_pro_monthly',
              unit_amount: 7900,
              currency: 'usd',
              recurring: { interval: 'month' },
            },
          },
        ],
      },
    } as unknown as Stripe.Subscription

    await syncSubscriptionStatus('org_123', stripeSubscription)

    expect(mocks.orgUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plan: 'FREE',
          billingInterval: null,
          limitProducts: SAAS_PLANS.FREE.limits.products,
          limitOrders: SAAS_PLANS.FREE.limits.orders,
          limitTeamMembers: SAAS_PLANS.FREE.limits.teamMembers,
          limitStorageMB: SAAS_PLANS.FREE.limits.storageMB,
        }),
      })
    )
  })
})

