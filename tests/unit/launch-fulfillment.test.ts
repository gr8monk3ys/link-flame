import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  order: { findUnique: vi.fn(), update: vi.fn() },
  digitalDownload: { findUnique: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
  digitalAsset: { findUnique: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({ prisma: db }))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/lib/url', () => ({ getBaseUrl: () => 'https://shop.example' }))

import { normalizeFulfillment, requiresShipping, stripeTaxCode, tracksInventory } from '@/lib/fulfillment'
import { claimDownload, generateDownloadToken, getOrderDownloads } from '@/lib/digital-downloads'
import { buildPrintfulItems, printFileUrl, submitPrintfulOrder, toPrintfulRecipient } from '@/lib/printful'

describe('fulfillment helpers', () => {
  it('treats unknown values as stocked goods', () => {
    expect(normalizeFulfillment(undefined)).toBe('stock')
    expect(normalizeFulfillment('nonsense')).toBe('stock')
  })

  it('only stocked goods track inventory; only digital goods skip shipping', () => {
    expect(tracksInventory('stock')).toBe(true)
    expect(tracksInventory('digital')).toBe(false)
    expect(tracksInventory('printful')).toBe(false)
    expect(requiresShipping('digital')).toBe(false)
    expect(requiresShipping('printful')).toBe(true)
  })

  it('picks the Stripe tax code by product kind', () => {
    expect(stripeTaxCode('digital')).toBe('txcd_10302000')
    expect(stripeTaxCode('printful', 'Apparel')).toBe('txcd_30011000')
    expect(stripeTaxCode('printful', 'Bags')).toBe('txcd_99999999')
  })
})

describe('digital downloads', () => {
  beforeEach(() => vi.clearAllMocks())

  it('generates URL-safe tokens that the download route accepts', () => {
    const token = generateDownloadToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(generateDownloadToken()).not.toBe(token)
  })

  it('rejects malformed tokens without touching the database', async () => {
    await expect(claimDownload('../etc/passwd')).resolves.toEqual({ ok: false, reason: 'not_found' })
    expect(db.digitalDownload.findUnique).not.toHaveBeenCalled()
  })

  it('refuses downloads for unpaid or refunded orders', async () => {
    db.digitalDownload.findUnique.mockResolvedValueOnce({
      id: 'd1', downloadCount: 0, maxDownloads: 10, assetId: 'a1', order: { status: 'refunded' },
    })
    await expect(claimDownload(generateDownloadToken())).resolves.toEqual({ ok: false, reason: 'not_paid' })
    expect(db.digitalDownload.updateMany).not.toHaveBeenCalled()
  })

  it('counts the download atomically and stops at the cap', async () => {
    const download = { id: 'd1', downloadCount: 10, maxDownloads: 10, assetId: 'a1', order: { status: 'paid' } }
    db.digitalDownload.findUnique.mockResolvedValue(download)
    db.digitalDownload.updateMany.mockResolvedValueOnce({ count: 0 })

    await expect(claimDownload(generateDownloadToken())).resolves.toEqual({ ok: false, reason: 'exhausted' })
    expect(db.digitalDownload.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'd1', downloadCount: { lt: 10 } } })
    )
  })

  it('returns the file once counted', async () => {
    db.digitalDownload.findUnique.mockResolvedValueOnce({
      id: 'd1', downloadCount: 2, maxDownloads: 10, assetId: 'a1', order: { status: 'partially_refunded' },
    })
    db.digitalDownload.updateMany.mockResolvedValueOnce({ count: 1 })
    db.digitalAsset.findUnique.mockResolvedValueOnce({
      filename: 'guide.pdf', contentType: 'application/pdf', data: new Uint8Array([37, 80, 68, 70]),
    })

    const claim = await claimDownload(generateDownloadToken())
    expect(claim).toMatchObject({ ok: true, filename: 'guide.pdf', contentType: 'application/pdf' })
  })

  it('builds absolute download links with downloads left', async () => {
    db.digitalDownload.findMany.mockResolvedValueOnce([
      {
        token: 'tok_abcdefghijklmnopqrstuvwxyz',
        downloadCount: 3,
        maxDownloads: 10,
        asset: { filename: 'guide.pdf', sizeBytes: 1000, sortOrder: 0, product: { title: 'Guide' } },
      },
    ])
    const links = await getOrderDownloads('order-1')
    expect(links).toEqual([
      expect.objectContaining({
        url: 'https://shop.example/api/downloads/tok_abcdefghijklmnopqrstuvwxyz',
        productTitle: 'Guide',
        downloadsLeft: 7,
      }),
    ])
  })
})

describe('Printful', () => {
  const shippingDetails = {
    name: 'Ada Lovelace',
    address: { line1: '1 Main St', line2: null, city: 'Santa Monica', state: 'CA', postal_code: '90401', country: 'US' },
  }
  const paidOrder = {
    id: 'order-1',
    status: 'paid',
    customerEmail: 'ada@example.com',
    shippingDetails,
    printfulOrderId: null,
    items: [
      {
        id: 'item-1', quantity: 2, price: '38.00', title: 'Tee',
        product: { fulfillment: 'printful', printfulVariantId: null, printFile: '/print/tee.png' },
        variant: { printfulVariantId: 46053 },
      },
      {
        id: 'item-2', quantity: 1, price: '9.00', title: 'Guide',
        product: { fulfillment: 'digital', printfulVariantId: null, printFile: null },
        variant: null,
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    process.env.PRINTFUL_API_KEY = 'test-key'
    delete process.env.PRINTFUL_AUTO_CONFIRM
  })

  it('maps a Stripe address to a Printful recipient, or null when incomplete', () => {
    expect(toPrintfulRecipient(shippingDetails, 'ada@example.com')).toEqual({
      name: 'Ada Lovelace', address1: '1 Main St', city: 'Santa Monica', state_code: 'CA',
      country_code: 'US', zip: '90401', email: 'ada@example.com',
    })
    expect(toPrintfulRecipient({ name: 'Ada', address: { line1: '1 Main St' } })).toBeNull()
  })

  it('sends only print-on-demand lines, preferring the variant mapping', () => {
    expect(printFileUrl('/print/tee.png')).toBe('https://shop.example/print/tee.png')
    const items = buildPrintfulItems(paidOrder)
    expect(items).toEqual([
      expect.objectContaining({
        variant_id: 46053, quantity: 2, retail_price: '38.00', external_id: 'item-1',
        files: [{ type: 'front', url: 'https://shop.example/print/tee.png' }],
      }),
    ])
  })

  it('creates a draft order and stores its id', async () => {
    db.order.findUnique.mockResolvedValueOnce(paidOrder)
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, result: { id: 777, status: 'draft' } }), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(submitPrintfulOrder('order-1')).resolves.toEqual({
      status: 'submitted', printfulOrderId: '777', printfulStatus: 'draft',
    })
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.printful.com/orders?confirm=false')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ external_id: 'order-1' })
    expect(db.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { printfulOrderId: '777', printfulStatus: 'draft', printfulError: null },
    })
  })

  it('records a failure for an admin to retry instead of throwing', async () => {
    db.order.findUnique.mockResolvedValueOnce(paidOrder)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 400, error: { message: 'Invalid address' } }), { status: 400 })
    ))

    const result = await submitPrintfulOrder('order-1')
    expect(result).toEqual({ status: 'failed', error: 'Printful 400: Invalid address' })
    expect(db.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { printfulStatus: 'failed', printfulError: 'Printful 400: Invalid address' },
    })
  })

  it('skips orders with nothing to print and orders already sent', async () => {
    db.order.findUnique.mockResolvedValueOnce({ ...paidOrder, items: [paidOrder.items[1]] })
    await expect(submitPrintfulOrder('order-1')).resolves.toMatchObject({ status: 'skipped' })

    db.order.findUnique.mockResolvedValueOnce({ ...paidOrder, printfulOrderId: '777' })
    await expect(submitPrintfulOrder('order-1')).resolves.toMatchObject({ status: 'submitted', printfulOrderId: '777' })
    expect(db.order.update).not.toHaveBeenCalled()
  })
})
