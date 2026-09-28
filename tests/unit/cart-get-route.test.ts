import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@prisma/client'

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getServerAuth: async () => ({ userId: null }) }))
vi.mock('@/lib/session', () => ({
  clearGuestSession: vi.fn(),
  getExistingGuestSessionId: vi.fn(),
  getUserIdForCart: async () => 'guest_abc',
}))
vi.mock('@/lib/prisma', () => ({
  prisma: { cartItem: { findMany: mocks.findMany } },
}))
vi.mock('@/lib/rate-limit', () => ({ getIdentifier: vi.fn(), checkRateLimit: vi.fn() }))
vi.mock('@/lib/csrf', () => ({ validateCsrfToken: vi.fn() }))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { GET } from '@/app/api/cart/route'

const d = (value: string | null) => (value === null ? null : new Prisma.Decimal(value))

function cartRow(variant: { price: string | null; salePrice: string | null } | null, product: { price: string; salePrice: string | null }) {
  return {
    id: 'ci-1',
    productId: 'p1',
    variantId: variant ? 'v1' : null,
    quantity: 1,
    product: { title: 'Wool dryer balls', image: '/p1.jpg', price: d(product.price), salePrice: d(product.salePrice) },
    variant: variant
      ? { id: 'v1', sku: null, size: 'L', color: null, colorCode: null, material: null, image: null, price: d(variant.price), salePrice: d(variant.salePrice) }
      : null,
  }
}

async function cartPrice() {
  const response = await GET(new Request('http://localhost/api/cart'))
  const payload = await response.json()
  return payload.data[0].price
}

// Must agree with app/api/checkout/route.ts, which is what Stripe charges:
// variant sale price > variant price > product sale price > product price.
describe('GET /api/cart price', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the variant sale price when the variant has one', async () => {
    mocks.findMany.mockResolvedValueOnce([cartRow({ price: '20.00', salePrice: '15.00' }, { price: '18.00', salePrice: null })])
    expect(await cartPrice()).toBe(15)
  })

  it('falls back to the variant price, then product sale price, then product price', async () => {
    mocks.findMany.mockResolvedValueOnce([cartRow({ price: '20.00', salePrice: null }, { price: '18.00', salePrice: '12.00' })])
    expect(await cartPrice()).toBe(20)

    mocks.findMany.mockResolvedValueOnce([cartRow(null, { price: '18.00', salePrice: '12.00' })])
    expect(await cartPrice()).toBe(12)

    mocks.findMany.mockResolvedValueOnce([cartRow(null, { price: '18.00', salePrice: null })])
    expect(await cartPrice()).toBe(18)
  })
})
