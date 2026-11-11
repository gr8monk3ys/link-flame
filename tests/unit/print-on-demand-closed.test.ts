import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PRINT_ON_DEMAND_OPEN } from '@/config/constants'
import { forSaleWhere, isForSale } from '@/lib/fulfillment'

describe('print-on-demand sales are closed (affiliate-first)', () => {
  it('ships with print-on-demand closed', () => {
    expect(PRINT_ON_DEMAND_OPEN).toBe(false)
  })

  it('keeps guides and stocked goods on sale, and takes printful items off', () => {
    expect(isForSale('digital')).toBe(true)
    expect(isForSale('stock')).toBe(true)
    expect(isForSale(undefined)).toBe(true)
    expect(isForSale('printful')).toBe(false)
  })

  it('filters printful products out of Prisma listings', () => {
    expect(forSaleWhere()).toEqual({ fulfillment: { not: 'printful' } })
  })
})

describe('print-on-demand sales reopened', () => {
  afterEach(() => {
    vi.doUnmock('@/config/constants')
    vi.resetModules()
  })

  it('lists and sells printful items again when the flag is true', async () => {
    vi.resetModules()
    vi.doMock('@/config/constants', async (importOriginal) => ({
      ...(await importOriginal<typeof import('@/config/constants')>()),
      PRINT_ON_DEMAND_OPEN: true,
    }))
    const fulfillment = await import('@/lib/fulfillment')
    expect(fulfillment.isForSale('printful')).toBe(true)
    expect(fulfillment.forSaleWhere()).toEqual({})
  })
})

// Tripwire: every place that lists, finds or sells products for shoppers must
// apply the filter, or the tote and tee leak back into the shop.
const GUARDED = [
  'app/api/products/route.ts',
  'app/api/products/[id]/route.ts',
  'app/api/products/bulk/route.ts',
  'app/api/products/categories/route.ts',
  'app/api/search/suggestions/route.ts',
  'app/search/SearchResults.tsx',
  'app/products/[id]/page.tsx',
  'app/sitemap.ts',
  'components/home/FeaturedProducts.tsx',
  'lib/quiz.ts',
  'app/api/cart/route.ts',
  'app/api/checkout/route.ts',
]

describe('shopper-facing product queries apply the for-sale filter', () => {
  it.each(GUARDED)('%s', (file) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    expect(source).toMatch(/\b(forSaleWhere|isForSale)\(/)
  })
})
