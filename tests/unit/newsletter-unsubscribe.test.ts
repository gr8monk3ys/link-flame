import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateCsrfToken: vi.fn(),
  getIdentifier: vi.fn(),
  checkStrictRateLimit: vi.fn(),
  deleteMany: vi.fn(),
}))

vi.mock('@/lib/csrf', () => ({
  validateCsrfToken: mocks.validateCsrfToken,
}))

vi.mock('@/lib/rate-limit', () => ({
  getIdentifier: mocks.getIdentifier,
  checkStrictRateLimit: mocks.checkStrictRateLimit,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { newsletter: { deleteMany: mocks.deleteMany } },
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { POST } from '@/app/api/newsletter/unsubscribe/route'
import {
  buildUnsubscribeUrl,
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from '@/lib/newsletter-token'

function request(body: unknown) {
  return new Request('http://localhost/api/newsletter/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('unsubscribe token', () => {
  it('verifies the token it created', () => {
    const token = createUnsubscribeToken('sub-1')
    expect(verifyUnsubscribeToken('sub-1', token)).toBe(true)
  })

  it('rejects a token made for another subscription', () => {
    const token = createUnsubscribeToken('sub-1')
    expect(verifyUnsubscribeToken('sub-2', token)).toBe(false)
  })

  it('rejects a token of the wrong length without throwing', () => {
    expect(verifyUnsubscribeToken('sub-1', 'short')).toBe(false)
    expect(verifyUnsubscribeToken('sub-1', '')).toBe(false)
    expect(verifyUnsubscribeToken('', 'anything')).toBe(false)
  })

  it('builds a link that carries the id and token, and no email address', () => {
    const url = new URL(buildUnsubscribeUrl('sub-1'))
    expect(url.pathname).toBe('/unsubscribe')
    expect(url.searchParams.get('id')).toBe('sub-1')
    expect(verifyUnsubscribeToken('sub-1', url.searchParams.get('t') ?? '')).toBe(true)
    expect([...url.searchParams.keys()].sort()).toEqual(['id', 't'])
  })
})

describe('POST /api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.validateCsrfToken.mockResolvedValue(true)
    mocks.getIdentifier.mockReturnValue('ip:127.0.0.1')
    mocks.checkStrictRateLimit.mockResolvedValue({ success: true, reset: Date.now() + 10_000 })
    mocks.deleteMany.mockResolvedValue({ count: 1 })
  })

  it('rejects a request without a valid CSRF token', async () => {
    mocks.validateCsrfToken.mockResolvedValueOnce(false)
    const response = await POST(request({ id: 'sub-1', token: createUnsubscribeToken('sub-1') }))
    expect(response.status).toBe(403)
    expect(mocks.deleteMany).not.toHaveBeenCalled()
  })

  it('rejects a request over the rate limit', async () => {
    mocks.checkStrictRateLimit.mockResolvedValueOnce({ success: false, reset: Date.now() + 10_000 })
    const response = await POST(request({ id: 'sub-1', token: createUnsubscribeToken('sub-1') }))
    expect(response.status).toBe(429)
    expect(mocks.deleteMany).not.toHaveBeenCalled()
  })

  it('rejects a forged token and removes nothing', async () => {
    const response = await POST(request({ id: 'sub-1', token: createUnsubscribeToken('sub-2') }))
    expect(response.status).toBe(400)
    expect(mocks.deleteMany).not.toHaveBeenCalled()
  })

  it('rejects a body without an id', async () => {
    const response = await POST(request({ token: 'abc' }))
    expect(response.status).toBe(400)
    expect(mocks.deleteMany).not.toHaveBeenCalled()
  })

  it('removes the subscription for a valid link', async () => {
    const response = await POST(request({ id: 'sub-1', token: createUnsubscribeToken('sub-1') }))
    expect(response.status).toBe(200)
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: 'sub-1' } })
    const body = await response.json()
    expect(body.data).toEqual({ unsubscribed: true, alreadyRemoved: false })
  })

  it('still succeeds when the same link is used twice', async () => {
    mocks.deleteMany.mockResolvedValueOnce({ count: 0 })
    const response = await POST(request({ id: 'sub-1', token: createUnsubscribeToken('sub-1') }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data).toEqual({ unsubscribed: true, alreadyRemoved: true })
  })
})
