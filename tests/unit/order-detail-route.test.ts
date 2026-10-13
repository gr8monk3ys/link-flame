import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'

const mocks = vi.hoisted(() => ({
  getServerAuth: vi.fn(),
  requireRole: vi.fn(),
  checkRateLimit: vi.fn(),
  findUnique: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getServerAuth: mocks.getServerAuth,
  requireRole: mocks.requireRole,
}))

vi.mock('@/lib/rate-limit', () => ({
  getIdentifier: () => 'user:user-1',
  checkRateLimit: mocks.checkRateLimit,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { order: { findUnique: mocks.findUnique } },
}))

vi.mock('@/lib/csrf', () => ({ validateCsrfToken: vi.fn() }))
vi.mock('@/lib/email', () => ({ sendShippingNotificationEmail: vi.fn() }))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { GET } from '@/app/api/orders/[id]/route'

describe('GET /api/orders/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getServerAuth.mockResolvedValue({ userId: 'user-1' })
    mocks.requireRole.mockResolvedValue(false)
    mocks.checkRateLimit.mockResolvedValue({ success: true, reset: Date.now() + 10_000 })
  })

  it('returns money fields as numbers the order page can format', async () => {
    mocks.findUnique.mockResolvedValueOnce({
      id: 'order-1',
      userId: 'user-1',
      amount: new Prisma.Decimal('42.50'),
      refundAmount: null,
      discountTotal: new Prisma.Decimal('5.00'),
      shippingStatus: 'shipped',
      trackingNumber: null,
      shippingCarrier: null,
      items: [
        {
          id: 'item-1',
          title: 'Shampoo bar',
          quantity: 2,
          price: new Prisma.Decimal('18.75'),
          product: { id: 'p1', image: '/p1.jpg', description: null },
          variant: null,
        },
      ],
    })

    const response = await GET(new Request('http://localhost/api/orders/order-1'), {
      params: Promise.resolve({ id: 'order-1' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.amount).toBe(42.5)
    expect(payload.data.refundAmount).toBeNull()
    expect(payload.data.discountTotal).toBe(5)
    expect(payload.data.items[0].price).toBe(18.75)
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'order-1', userId: 'user-1' } })
    )
  })
})
