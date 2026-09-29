import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Impact Utility Unit Tests
 *
 * Tests the environmental impact calculation and management utilities:
 * - Milestone lookup and achievement detection
 * - Impact value formatting for display
 * - Per-order impact calculation and storage (Prisma-backed)
 * - Personal, community, order, cart-preview, and catalogue impact reads
 */

// Mock the Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    productImpact: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    impactMetric: {
      findMany: vi.fn(),
    },
    orderImpact: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    userImpact: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Import the mocked prisma after mocking
import { prisma } from '@/lib/prisma'
import {
  IMPACT_COMPARISONS,
  MILESTONES,
  getNextMilestone,
  checkMilestoneAchieved,
  calculateOrderImpact,
  storeOrderImpact,
  getPersonalImpact,
  getCommunityImpact,
  getOrderImpact,
  getCartImpactPreview,
  formatImpactValue,
  getCatalogImpact,
  getActiveMetrics,
} from '@/lib/impact'

describe('getNextMilestone', () => {
  it('returns the first milestone above the current value', () => {
    expect(getNextMilestone('plastic-bottles-saved', 0)).toBe(10)
    expect(getNextMilestone('plastic-bottles-saved', 40)).toBe(50)
  })

  it('returns the milestone itself as the next target only once passed', () => {
    // Current value equal to a milestone has already "achieved" it
    expect(getNextMilestone('plastic-bottles-saved', 10)).toBe(50)
  })

  it('returns null once every milestone has been passed', () => {
    const last = MILESTONES['plastic-bottles-saved'].at(-1) as number
    expect(getNextMilestone('plastic-bottles-saved', last)).toBeNull()
    expect(getNextMilestone('plastic-bottles-saved', last + 1000)).toBeNull()
  })

  it('returns null for an unknown metric slug', () => {
    expect(getNextMilestone('not-a-real-metric', 5)).toBeNull()
  })
})

describe('checkMilestoneAchieved', () => {
  it('returns the milestone when it is crossed between the two values', () => {
    expect(checkMilestoneAchieved('plastic-bottles-saved', 8, 10)).toBe(10)
    expect(checkMilestoneAchieved('plastic-bottles-saved', 45, 60)).toBe(50)
  })

  it('returns the lowest crossed milestone when several are skipped at once', () => {
    expect(checkMilestoneAchieved('plastic-bottles-saved', 5, 300)).toBe(10)
  })

  it('returns null when no milestone is crossed', () => {
    expect(checkMilestoneAchieved('plastic-bottles-saved', 11, 12)).toBeNull()
  })

  it('returns null when the previous value already met the milestone', () => {
    expect(checkMilestoneAchieved('plastic-bottles-saved', 10, 20)).toBeNull()
  })

  it('returns null for an unknown metric slug', () => {
    expect(checkMilestoneAchieved('not-a-real-metric', 0, 1000)).toBeNull()
  })
})

describe('IMPACT_COMPARISONS', () => {
  it('formats a human comparison for each known metric', () => {
    expect(IMPACT_COMPARISONS['plastic-bottles-saved'](21)).toBe(
      "That's 7 weeks of single-use plastic avoided!"
    )
    expect(IMPACT_COMPARISONS['single-use-items-replaced'](90)).toBe(
      'Equivalent to 3 months of disposable items!'
    )
    expect(IMPACT_COMPARISONS['carbon-offset'](42)).toBe(
      'Like planting 2 trees for a year!'
    )
    expect(IMPACT_COMPARISONS['trees-planted'](5)).toBe(
      '100 kg of CO2 absorbed per year!'
    )
    expect(IMPACT_COMPARISONS['water-saved'](150)).toBe(
      "That's 3 showers worth of water!"
    )
    expect(IMPACT_COMPARISONS['waste-diverted'](10)).toBe(
      '22 pounds kept out of landfills!'
    )
  })
})

describe('formatImpactValue', () => {
  it('abbreviates values of 1000 or more with a "k" suffix', () => {
    expect(formatImpactValue(1500, 'bottles')).toBe('1.5k bottles')
    expect(formatImpactValue(1000, 'bottles')).toBe('1.0k bottles')
  })

  it('rounds values of 1 or more with no decimals', () => {
    expect(formatImpactValue(42.6, 'bottles')).toBe('43 bottles')
    expect(formatImpactValue(1, 'bottles')).toBe('1 bottles')
  })

  it('keeps one decimal place for values under 1', () => {
    expect(formatImpactValue(0.25, 'kg')).toBe('0.3 kg')
    expect(formatImpactValue(0, 'kg')).toBe('0.0 kg')
  })
})

describe('calculateOrderImpact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sums per-unit impact across items and quantities, grouped by metric', async () => {
    vi.mocked(prisma.productImpact.findMany).mockResolvedValue([
      { id: 'pi-1', productId: 'prod-1', metricId: 'metric-bottles', valuePerUnit: 3, metric: {} },
      { id: 'pi-2', productId: 'prod-1', metricId: 'metric-co2', valuePerUnit: 1.5, metric: {} },
      { id: 'pi-3', productId: 'prod-2', metricId: 'metric-bottles', valuePerUnit: 2, metric: {} },
    ] as any)

    const result = await calculateOrderImpact([
      { productId: 'prod-1', quantity: 2 },
      { productId: 'prod-2', quantity: 3 },
    ])

    expect(result.get('metric-bottles')).toBe(3 * 2 + 2 * 3)
    expect(result.get('metric-co2')).toBe(1.5 * 2)
    expect(prisma.productImpact.findMany).toHaveBeenCalledWith({
      where: { productId: { in: ['prod-1', 'prod-2'] } },
      include: { metric: true },
    })
  })

  it('returns an empty map when no products have impact records', async () => {
    vi.mocked(prisma.productImpact.findMany).mockResolvedValue([])

    const result = await calculateOrderImpact([{ productId: 'prod-1', quantity: 1 }])

    expect(result.size).toBe(0)
  })
})

describe('storeOrderImpact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation(async (operations: any) => {
      if (typeof operations === 'function') {
        return operations(prisma)
      }
      return Promise.all(operations)
    })
  })

  it('creates an order impact record and upserts the running user total', async () => {
    vi.mocked(prisma.productImpact.findMany).mockResolvedValue([
      { id: 'pi-1', productId: 'prod-1', metricId: 'metric-bottles', valuePerUnit: 5, metric: {} },
    ] as any)
    vi.mocked(prisma.impactMetric.findMany).mockResolvedValue([
      { id: 'metric-bottles', slug: 'plastic-bottles-saved', name: 'Bottles', unit: 'bottles', iconName: 'bottle', isActive: true, sortOrder: 0 },
    ] as any)
    vi.mocked(prisma.userImpact.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.userImpact.upsert).mockResolvedValue({} as any)
    vi.mocked(prisma.orderImpact.create).mockResolvedValue({} as any)

    const result = await storeOrderImpact('order-1', 'user-1', [
      { productId: 'prod-1', quantity: 2 },
    ])

    expect(prisma.orderImpact.create).toHaveBeenCalledWith({
      data: { orderId: 'order-1', metricId: 'metric-bottles', value: 10 },
    })
    expect(prisma.userImpact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_metricId: { userId: 'user-1', metricId: 'metric-bottles' } },
        create: { userId: 'user-1', metricId: 'metric-bottles', totalValue: 10 },
      })
    )
    expect(result.orderImpacts).toEqual([{ metricId: 'metric-bottles', value: 10 }])
  })

  it('adds the order value to the existing user total instead of overwriting it', async () => {
    vi.mocked(prisma.productImpact.findMany).mockResolvedValue([
      { id: 'pi-1', productId: 'prod-1', metricId: 'metric-bottles', valuePerUnit: 5, metric: {} },
    ] as any)
    vi.mocked(prisma.impactMetric.findMany).mockResolvedValue([
      { id: 'metric-bottles', slug: 'plastic-bottles-saved', name: 'Bottles', unit: 'bottles', iconName: 'bottle', isActive: true, sortOrder: 0 },
    ] as any)
    vi.mocked(prisma.userImpact.findUnique).mockResolvedValue({ totalValue: 40 } as any)
    vi.mocked(prisma.userImpact.upsert).mockResolvedValue({} as any)
    vi.mocked(prisma.orderImpact.create).mockResolvedValue({} as any)

    await storeOrderImpact('order-2', 'user-1', [{ productId: 'prod-1', quantity: 2 }])

    expect(prisma.userImpact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ totalValue: 50 }),
      })
    )
  })

  it('reports a milestone when the new total crosses one', async () => {
    vi.mocked(prisma.productImpact.findMany).mockResolvedValue([
      { id: 'pi-1', productId: 'prod-1', metricId: 'metric-bottles', valuePerUnit: 5, metric: {} },
    ] as any)
    vi.mocked(prisma.impactMetric.findMany).mockResolvedValue([
      { id: 'metric-bottles', slug: 'plastic-bottles-saved', name: 'Bottles', unit: 'bottles', iconName: 'bottle', isActive: true, sortOrder: 0 },
    ] as any)
    // previous total 8, order adds 2 => new total 10, crossing the first milestone (10)
    vi.mocked(prisma.userImpact.findUnique).mockResolvedValue({ totalValue: 8 } as any)
    vi.mocked(prisma.userImpact.upsert).mockResolvedValue({} as any)
    vi.mocked(prisma.orderImpact.create).mockResolvedValue({} as any)

    const result = await storeOrderImpact('order-3', 'user-1', [{ productId: 'prod-1', quantity: 2 }])

    expect(result.milestones).toEqual([{ metricSlug: 'plastic-bottles-saved', milestone: 10 }])
  })

  it('does not report a milestone when none is crossed', async () => {
    vi.mocked(prisma.productImpact.findMany).mockResolvedValue([
      { id: 'pi-1', productId: 'prod-1', metricId: 'metric-bottles', valuePerUnit: 1, metric: {} },
    ] as any)
    vi.mocked(prisma.impactMetric.findMany).mockResolvedValue([
      { id: 'metric-bottles', slug: 'plastic-bottles-saved', name: 'Bottles', unit: 'bottles', iconName: 'bottle', isActive: true, sortOrder: 0 },
    ] as any)
    vi.mocked(prisma.userImpact.findUnique).mockResolvedValue({ totalValue: 2 } as any)
    vi.mocked(prisma.userImpact.upsert).mockResolvedValue({} as any)
    vi.mocked(prisma.orderImpact.create).mockResolvedValue({} as any)

    const result = await storeOrderImpact('order-4', 'user-1', [{ productId: 'prod-1', quantity: 1 }])

    expect(result.milestones).toEqual([])
  })
})

describe('getPersonalImpact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shapes each user impact with a comparison, next milestone, and progress', async () => {
    vi.mocked(prisma.userImpact.findMany).mockResolvedValue([
      {
        id: 'ui-1',
        metricId: 'metric-bottles',
        totalValue: 25,
        lastUpdatedAt: new Date('2026-01-01'),
        metric: {
          name: 'Plastic Bottles Saved',
          slug: 'plastic-bottles-saved',
          unit: 'bottles',
          iconName: 'bottle',
        },
      },
    ] as any)

    const result = await getPersonalImpact('user-1')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      metricId: 'metric-bottles',
      totalValue: 25,
      nextMilestone: 50,
      progress: 50,
    })
    expect(result[0].comparison).toBe(IMPACT_COMPARISONS['plastic-bottles-saved'](25))
  })

  it('reports 100% progress once every milestone has been achieved', async () => {
    const maxed = MILESTONES['plastic-bottles-saved'].at(-1) as number
    vi.mocked(prisma.userImpact.findMany).mockResolvedValue([
      {
        id: 'ui-1',
        metricId: 'metric-bottles',
        totalValue: maxed,
        lastUpdatedAt: new Date('2026-01-01'),
        metric: {
          name: 'Plastic Bottles Saved',
          slug: 'plastic-bottles-saved',
          unit: 'bottles',
          iconName: 'bottle',
        },
      },
    ] as any)

    const result = await getPersonalImpact('user-1')

    expect(result[0].nextMilestone).toBeNull()
    expect(result[0].progress).toBe(100)
  })
})

describe('getCommunityImpact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggregates total value and contributor count per active metric', async () => {
    vi.mocked(prisma.impactMetric.findMany).mockResolvedValue([
      {
        id: 'metric-bottles',
        name: 'Plastic Bottles Saved',
        slug: 'plastic-bottles-saved',
        unit: 'bottles',
        iconName: 'bottle',
        description: 'desc',
        isActive: true,
        sortOrder: 0,
      },
    ] as any)
    vi.mocked(prisma.userImpact.aggregate).mockResolvedValue({
      _sum: { totalValue: 300 },
      _count: { userId: 12 },
    } as any)

    const result = await getCommunityImpact()

    expect(result).toEqual([
      expect.objectContaining({
        metricId: 'metric-bottles',
        totalValue: 300,
        contributorCount: 12,
        comparison: IMPACT_COMPARISONS['plastic-bottles-saved'](300),
      }),
    ])
  })

  it('defaults total value and contributor count to zero with no activity', async () => {
    vi.mocked(prisma.impactMetric.findMany).mockResolvedValue([
      {
        id: 'metric-bottles',
        name: 'Plastic Bottles Saved',
        slug: 'plastic-bottles-saved',
        unit: 'bottles',
        iconName: 'bottle',
        description: null,
        isActive: true,
        sortOrder: 0,
      },
    ] as any)
    vi.mocked(prisma.userImpact.aggregate).mockResolvedValue({
      _sum: { totalValue: null },
      _count: { userId: 0 },
    } as any)

    const result = await getCommunityImpact()

    expect(result[0]).toMatchObject({ totalValue: 0, contributorCount: 0 })
  })
})

describe('getOrderImpact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shapes each stored order impact record with its comparison text', async () => {
    vi.mocked(prisma.orderImpact.findMany).mockResolvedValue([
      {
        metricId: 'metric-bottles',
        value: 15,
        metric: { name: 'Plastic Bottles Saved', slug: 'plastic-bottles-saved', unit: 'bottles', iconName: 'bottle' },
      },
    ] as any)

    const result = await getOrderImpact('order-1')

    expect(result).toEqual([
      {
        metricId: 'metric-bottles',
        name: 'Plastic Bottles Saved',
        slug: 'plastic-bottles-saved',
        unit: 'bottles',
        iconName: 'bottle',
        value: 15,
        comparison: IMPACT_COMPARISONS['plastic-bottles-saved'](15),
      },
    ])
  })
})

describe('getCartImpactPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('estimates impact for cart items without persisting anything', async () => {
    vi.mocked(prisma.productImpact.findMany).mockResolvedValue([
      { id: 'pi-1', productId: 'prod-1', metricId: 'metric-bottles', valuePerUnit: 4, metric: {} },
    ] as any)
    vi.mocked(prisma.impactMetric.findMany).mockResolvedValue([
      { id: 'metric-bottles', name: 'Plastic Bottles Saved', slug: 'plastic-bottles-saved', unit: 'bottles', iconName: 'bottle', isActive: true, sortOrder: 0 },
    ] as any)

    const result = await getCartImpactPreview([{ productId: 'prod-1', quantity: 3 }])

    expect(result).toEqual([
      {
        metricId: 'metric-bottles',
        name: 'Plastic Bottles Saved',
        slug: 'plastic-bottles-saved',
        unit: 'bottles',
        iconName: 'bottle',
        estimatedValue: 12,
      },
    ])
    expect(prisma.orderImpact.create).not.toHaveBeenCalled()
  })
})

describe('getCatalogImpact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sums the measured per-unit value across the catalogue, by metric', async () => {
    vi.mocked(prisma.impactMetric.findMany).mockResolvedValue([
      { id: 'metric-bottles', name: 'Plastic Bottles Saved', slug: 'plastic-bottles-saved', unit: 'bottles', isActive: true, sortOrder: 0 },
      { id: 'metric-co2', name: 'Carbon Offset', slug: 'carbon-offset', unit: 'kg', isActive: true, sortOrder: 1 },
    ] as any)
    vi.mocked(prisma.productImpact.groupBy).mockResolvedValue([
      { metricId: 'metric-bottles', _sum: { valuePerUnit: 240 } },
    ] as any)

    const result = await getCatalogImpact()

    // Metrics with no summed data (carbon-offset) are dropped, not shown as zero
    expect(result).toEqual([
      { slug: 'plastic-bottles-saved', name: 'Plastic Bottles Saved', unit: 'bottles', total: 240 },
    ])
  })
})

describe('getActiveMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns active metrics ordered by sortOrder', async () => {
    const metrics = [
      { id: 'metric-bottles', isActive: true, sortOrder: 0 },
    ]
    vi.mocked(prisma.impactMetric.findMany).mockResolvedValue(metrics as any)

    const result = await getActiveMetrics()

    expect(result).toBe(metrics)
    expect(prisma.impactMetric.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  })
})
