import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateCsrfToken: vi.fn(),
  getServerAuth: vi.fn(),
  getUserIdForCart: vi.fn(),
  getIdentifier: vi.fn(),
  checkRateLimit: vi.fn(),
  updateSavedItemNote: vi.fn(),
}))

vi.mock('@/lib/csrf', () => ({
  validateCsrfToken: mocks.validateCsrfToken,
}))

vi.mock('@/lib/auth', () => ({
  getServerAuth: mocks.getServerAuth,
}))

vi.mock('@/lib/session', () => ({
  getUserIdForCart: mocks.getUserIdForCart,
}))

vi.mock('@/lib/rate-limit', () => ({
  getIdentifier: mocks.getIdentifier,
  checkRateLimit: mocks.checkRateLimit,
}))

vi.mock('@/lib/wishlists', () => ({
  updateSavedItemNote: mocks.updateSavedItemNote,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

import { PATCH } from '@/app/api/wishlists/items/[itemId]/route'

describe('Wishlist item note route', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.validateCsrfToken.mockResolvedValue(true)
    mocks.getServerAuth.mockResolvedValue({ userId: 'auth-user-1' })
    mocks.getUserIdForCart.mockResolvedValue('user-1')
    mocks.getIdentifier.mockReturnValue('user:user-1')
    mocks.checkRateLimit.mockResolvedValue({
      success: true,
      reset: Date.now() + 10_000,
    })
  })

  it('rejects requests with invalid CSRF token', async () => {
    mocks.validateCsrfToken.mockResolvedValueOnce(false)

    const response = await PATCH(
      new Request('http://localhost/api/wishlists/items/item-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ note: 'Gift idea' }),
      }),
      { params: Promise.resolve({ itemId: 'item-1' }) }
    )

    const payload = await response.json()
    expect(response.status).toBe(403)
    expect(payload.success).toBe(false)
    expect(payload.error?.code).toBe('CSRF_VALIDATION_FAILED')
    expect(mocks.updateSavedItemNote).not.toHaveBeenCalled()
  })

  it('returns 404 when saved item does not exist', async () => {
    mocks.updateSavedItemNote.mockResolvedValueOnce({
      success: false,
      error: 'Item not found',
    })

    const response = await PATCH(
      new Request('http://localhost/api/wishlists/items/item-missing', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ note: 'Gift idea' }),
      }),
      { params: Promise.resolve({ itemId: 'item-missing' }) }
    )

    expect(response.status).toBe(404)
    expect(mocks.updateSavedItemNote).toHaveBeenCalledWith('item-missing', 'user-1', 'Gift idea')
  })

  it('updates note when request is valid', async () => {
    const addedAt = new Date('2026-01-01T00:00:00.000Z')

    mocks.updateSavedItemNote.mockResolvedValueOnce({
      success: true,
      item: {
        id: 'item-1',
        productId: 'product-1',
        note: 'Birthday gift',
        addedAt,
      },
    })

    const response = await PATCH(
      new Request('http://localhost/api/wishlists/items/item-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ note: 'Birthday gift' }),
      }),
      { params: Promise.resolve({ itemId: 'item-1' }) }
    )

    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data).toEqual({
      id: 'item-1',
      productId: 'product-1',
      note: 'Birthday gift',
      addedAt: addedAt.toISOString(),
    })
  })
})
