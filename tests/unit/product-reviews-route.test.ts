import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ getServerAuth: vi.fn() }))
vi.mock('@/lib/csrf', () => ({ validateCsrfToken: vi.fn() }))
vi.mock('@/lib/rate-limit', () => ({
  getIdentifier: () => 'ip:test',
  checkRateLimit: async () => ({ success: true, reset: Date.now() + 10_000 }),
  checkStrictRateLimit: vi.fn(),
}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { findUnique: async () => ({ id: 'p1' }) },
    review: {
      findMany: mocks.findMany,
      count: async () => 0,
      aggregate: async () => ({ _avg: { rating: null } }),
      groupBy: async () => [],
    },
  },
}))

import { GET } from '@/app/api/products/[id]/reviews/route'

const get = (query: string) =>
  GET(new Request(`http://localhost/api/products/p1/reviews${query}`), {
    params: Promise.resolve({ id: 'p1' }),
  })

describe('GET /api/products/[id]/reviews query params', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findMany.mockResolvedValue([])
  })

  it('falls back to safe defaults for unknown sort fields and negative paging', async () => {
    const response = await get('?sortBy=user&order=sideways&offset=-1&limit=-5')

    expect(response.status).toBe(200)
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' }, skip: 0, take: 10 })
    )
  })

  it('passes through supported sorting and paging', async () => {
    await get('?sortBy=rating&order=asc&offset=20&limit=5')

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { rating: 'asc' }, skip: 20, take: 5 })
    )
  })
})
