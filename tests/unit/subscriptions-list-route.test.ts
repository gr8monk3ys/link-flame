import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'

const mocks = vi.hoisted(() => ({
  getServerAuth: vi.fn(),
  count: vi.fn(),
  findMany: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getServerAuth: mocks.getServerAuth }))
vi.mock('@/lib/rate-limit', () => ({
  getIdentifier: () => 'ip:test',
  checkRateLimit: async () => ({ success: true, reset: Date.now() + 10_000 }),
}))
vi.mock('@/lib/prisma', () => ({
  prisma: { subscription: { count: mocks.count, findMany: mocks.findMany } },
}))
vi.mock('@/lib/csrf', () => ({ validateCsrfToken: vi.fn() }))
vi.mock('@/lib/stripe-server', () => ({ getStripe: vi.fn() }))
vi.mock('@/lib/stripe-subscription', () => ({
  archiveStripePrices: vi.fn(),
  createSubscriptionCheckout: vi.fn(),
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { GET } from '@/app/api/subscriptions/route'

describe('GET /api/subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getServerAuth.mockResolvedValue({ userId: 'user-1' })
  })

  it('returns item prices as numbers the subscription card can format', async () => {
    mocks.count.mockResolvedValueOnce(1)
    mocks.findMany.mockResolvedValueOnce([
      {
        id: 'sub-1',
        userId: 'user-1',
        items: [
          {
            id: 'si-1',
            quantity: 1,
            discountPercent: 10,
            priceAtSubscription: new Prisma.Decimal('12.99'),
            product: {
              id: 'p1',
              title: 'Refill',
              image: '/p1.jpg',
              price: new Prisma.Decimal('12.99'),
              salePrice: null,
              isSubscribable: true,
            },
            variant: {
              id: 'v1',
              price: new Prisma.Decimal('14.00'),
              salePrice: null,
            },
          },
        ],
      },
    ])

    const response = await GET(new NextRequest('http://localhost/api/subscriptions'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    const item = payload.data[0].items[0]
    expect(item.priceAtSubscription).toBe(12.99)
    expect(item.product.price).toBe(12.99)
    expect(item.product.salePrice).toBeNull()
    expect(item.variant.price).toBe(14)
  })
})
