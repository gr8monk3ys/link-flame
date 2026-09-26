import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateCsrfToken: vi.fn(),
  getServerAuth: vi.fn(),
  getIdentifier: vi.fn(),
  checkRateLimit: vi.fn(),
  checkStrictRateLimit: vi.fn(),
  sessionsCreate: vi.fn(),
  sessionsRetrieve: vi.fn(),
  prisma: {
    giftCard: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    giftCardTransaction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/csrf', () => ({ validateCsrfToken: mocks.validateCsrfToken }))
vi.mock('@/lib/auth', () => ({ getServerAuth: mocks.getServerAuth }))
vi.mock('@/lib/rate-limit', () => ({
  getIdentifier: mocks.getIdentifier,
  checkRateLimit: mocks.checkRateLimit,
  checkStrictRateLimit: mocks.checkStrictRateLimit,
}))
vi.mock('@/lib/stripe-server', () => ({
  getStripe: () => ({
    checkout: {
      sessions: { create: mocks.sessionsCreate, retrieve: mocks.sessionsRetrieve },
    },
  }),
}))
vi.mock('@/lib/url', () => ({ getBaseUrl: () => 'https://shop.test' }))
vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { POST } from '@/app/api/gift-cards/route'
import { GET } from '@/app/api/gift-cards/purchase/route'

function purchaseRequest(body: unknown) {
  return new Request('https://shop.test/api/gift-cards', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/gift-cards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.validateCsrfToken.mockResolvedValue(true)
    mocks.getServerAuth.mockResolvedValue({ userId: 'user-1' })
    mocks.getIdentifier.mockReturnValue('user:user-1')
    mocks.checkStrictRateLimit.mockResolvedValue({ success: true, reset: 0 })
    mocks.prisma.giftCard.findUnique.mockResolvedValue(null)
    mocks.prisma.giftCard.create.mockImplementation(async ({ data }) => ({
      id: 'gc-1',
      code: data.code,
      initialBalance: data.initialBalance,
      currentBalance: data.currentBalance,
      status: data.status,
      expiresAt: data.expiresAt,
    }))
    mocks.sessionsCreate.mockResolvedValue({ id: 'cs_test_abc', url: 'https://checkout.stripe.com/c/pay/cs_test_abc' })
  })

  it('creates an unpaid card and returns only a Stripe checkout URL, never the code', async () => {
    const response = await POST(purchaseRequest({ amount: 50 }))
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.data).toEqual({ checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_abc' })
    expect(JSON.stringify(payload)).not.toMatch(/"code"/)

    const created = mocks.prisma.giftCard.create.mock.calls[0][0].data
    expect(created.status).toBe('PENDING_PAYMENT')

    const session = mocks.sessionsCreate.mock.calls[0][0]
    expect(session.mode).toBe('payment')
    expect(session.line_items[0].price_data.unit_amount).toBe(5000)
    expect(session.metadata).toEqual({ type: 'gift_card', giftCardId: 'gc-1', userId: 'user-1' })
    expect(session.success_url).toBe('https://shop.test/gift-cards?gift_card_session={CHECKOUT_SESSION_ID}')
  })

  it('charges whole cents and stores the charged amount', async () => {
    await POST(purchaseRequest({ amount: 25.555 }))

    expect(mocks.sessionsCreate.mock.calls[0][0].line_items[0].price_data.unit_amount).toBe(2556)
    expect(mocks.prisma.giftCard.create.mock.calls[0][0].data.initialBalance).toBe(25.56)
  })

  it('cancels the pending card when Stripe session creation fails', async () => {
    mocks.sessionsCreate.mockRejectedValueOnce(new Error('stripe down'))
    mocks.prisma.giftCard.updateMany.mockResolvedValue({ count: 1 })

    const response = await POST(purchaseRequest({ amount: 50 }))

    expect(response.status).toBe(500)
    expect(mocks.prisma.giftCard.updateMany).toHaveBeenCalledWith({
      where: { id: 'gc-1', status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED' },
    })
  })
})

describe('GET /api/gift-cards/purchase', () => {
  const activeCard = {
    id: 'gc-1',
    code: 'ABCDEFGHJKLMNPQR',
    initialBalance: 50,
    currentBalance: 50,
    status: 'ACTIVE',
    expiresAt: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getIdentifier.mockReturnValue('ip:1')
    mocks.checkRateLimit.mockResolvedValue({ success: true, reset: 0 })
    mocks.prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
      cb({
        giftCard: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          findUnique: vi.fn().mockResolvedValue(activeCard),
        },
        giftCardTransaction: { create: vi.fn() },
      })
    )
  })

  const get = (sessionId: string) =>
    GET(new Request(`https://shop.test/api/gift-cards/purchase?session_id=${encodeURIComponent(sessionId)}`))

  it('does not activate or reveal the card until Stripe reports the session paid', async () => {
    mocks.sessionsRetrieve.mockResolvedValue({
      id: 'cs_test_abc',
      payment_status: 'unpaid',
      metadata: { type: 'gift_card', giftCardId: 'gc-1' },
    })

    const response = await get('cs_test_abc')

    expect(response.status).toBe(409)
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
    expect(JSON.stringify(await response.json())).not.toContain('ABCD')
  })

  it('activates a paid card and returns its code', async () => {
    mocks.sessionsRetrieve.mockResolvedValue({
      id: 'cs_test_abc',
      payment_status: 'paid',
      metadata: { type: 'gift_card', giftCardId: 'gc-1' },
    })

    const response = await get('cs_test_abc')
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data.code).toBe('ABCD-EFGH-JKLM-NPQR')
    expect(payload.data.status).toBe('ACTIVE')
  })

  it('ignores paid sessions that are not gift card purchases', async () => {
    mocks.sessionsRetrieve.mockResolvedValue({
      id: 'cs_test_order',
      payment_status: 'paid',
      metadata: { userId: 'user-1' },
    })

    const response = await get('cs_test_order')

    expect(response.status).toBe(404)
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects malformed session ids without calling Stripe', async () => {
    const response = await get('../../v1/customers')

    expect(response.status).toBe(400)
    expect(mocks.sessionsRetrieve).not.toHaveBeenCalled()
  })
})
