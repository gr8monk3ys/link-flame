import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  sendShippingNotificationEmail: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: { order: { findUnique: mocks.findUnique, update: mocks.update } },
}))
vi.mock('@/lib/email', () => ({ sendShippingNotificationEmail: mocks.sendShippingNotificationEmail }))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { POST } from '@/app/api/printful/webhook/route'

const post = (body: unknown, secret = 'shh-secret') =>
  POST(
    new Request(`https://shop.example/api/printful/webhook?secret=${secret}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  )

const shipped = {
  type: 'package_shipped',
  data: {
    order: { id: 777, external_id: 'order-1', status: 'fulfilled' },
    shipment: { carrier: 'USPS', tracking_number: '9400100000000000000000' },
  },
}

describe('POST /api/printful/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PRINTFUL_WEBHOOK_SECRET = 'shh-secret'
    mocks.findUnique.mockResolvedValue({
      id: 'order-1', customerEmail: 'ada@example.com', customerName: 'Ada',
      shippingStatus: 'processing', trackingNumber: null,
    })
  })

  it('rejects requests without the shared secret', async () => {
    const response = await post(shipped, 'wrong-secret')
    expect(response.status).toBe(401)
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })

  it('marks the order shipped and emails the tracking number', async () => {
    const response = await post(shipped)
    expect(response.status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: expect.objectContaining({
        shippingStatus: 'shipped',
        trackingNumber: '9400100000000000000000',
        shippingCarrier: 'USPS',
      }),
    })
    expect(mocks.sendShippingNotificationEmail).toHaveBeenCalledWith(
      'ada@example.com',
      expect.objectContaining({ orderId: 'order-1', trackingNumber: '9400100000000000000000' })
    )
  })

  it('does not email twice when Printful retries the same shipment', async () => {
    mocks.findUnique.mockResolvedValueOnce({
      id: 'order-1', customerEmail: 'ada@example.com', customerName: 'Ada',
      shippingStatus: 'shipped', trackingNumber: '9400100000000000000000',
    })
    await post(shipped)
    expect(mocks.sendShippingNotificationEmail).not.toHaveBeenCalled()
  })

  it('records a failed Printful order for an admin', async () => {
    await post({ type: 'order_failed', data: { reason: 'Bad print file', order: { external_id: 'order-1' } } })
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { printfulStatus: 'failed', printfulError: 'Bad print file' },
    })
  })

  it('acknowledges events for orders it does not know', async () => {
    mocks.findUnique.mockResolvedValueOnce(null)
    const response = await post(shipped)
    expect(response.status).toBe(200)
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
