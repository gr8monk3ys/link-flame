import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  productCount: vi.fn(),
  orderCount: vi.fn(),
  loggerInfo: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      count: mocks.productCount,
    },
    order: {
      count: mocks.orderCount,
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    error: mocks.loggerError,
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  getOrganizationUsage,
  getUsageHistory,
  projectMonthEndUsage,
  recordUsageEvent,
  wouldUpgradeResolveLimits,
  getSuggestedPlan,
} from '@/lib/billing/usage';

describe('billing usage advanced helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.productCount.mockResolvedValue(5);
    mocks.orderCount.mockResolvedValue(12);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs and rethrows when usage query fails', async () => {
    const error = new Error('database unavailable');
    mocks.productCount.mockRejectedValueOnce(error);

    await expect(getOrganizationUsage('org_error')).rejects.toThrow('database unavailable');
    expect(mocks.loggerError).toHaveBeenCalledWith(
      'Failed to get organization usage',
      error,
      { organizationId: 'org_error' }
    );
  });

  it('records usage events through logger', async () => {
    await recordUsageEvent('org_1', 'products', 'add', 2, { source: 'import' });

    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      'Usage event recorded',
      expect.objectContaining({
        organizationId: 'org_1',
        resource: 'products',
        action: 'add',
        quantity: 2,
      })
    );
  });

  it('returns usage history placeholder and logs request context', async () => {
    const startDate = new Date('2026-01-01T00:00:00.000Z');
    const endDate = new Date('2026-01-31T23:59:59.999Z');
    const history = await getUsageHistory('org_1', 'orders', startDate, endDate);

    expect(history).toEqual([]);
    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      'Getting usage history',
      expect.objectContaining({
        organizationId: 'org_1',
        resource: 'orders',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
    );
  });

  it('projects month-end usage based on current daily average', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-10T12:00:00.000Z'));
    mocks.productCount.mockResolvedValue(50);
    mocks.orderCount.mockResolvedValue(12);

    const projection = await projectMonthEndUsage('org_1', 'products');

    // 50 current usage / day 10 = 5 per day, Feb 2026 has 28 days => 140 projected.
    expect(projection).toBe(140);
    vi.useRealTimers();
  });

  it('detects when upgrade resolves exceeded limits', async () => {
    mocks.productCount.mockResolvedValue(80);
    mocks.orderCount.mockResolvedValue(400);

    const resolves = await wouldUpgradeResolveLimits('org_1', 'FREE', 'STARTER');
    expect(resolves).toBe(true);
  });

  it('detects when target plan still cannot resolve exceeded limits', async () => {
    mocks.productCount.mockResolvedValue(5000);
    mocks.orderCount.mockResolvedValue(50_000);

    const resolves = await wouldUpgradeResolveLimits('org_1', 'FREE', 'STARTER');
    expect(resolves).toBe(false);
  });

  it('returns true when nothing is exceeded for current plan', async () => {
    mocks.productCount.mockResolvedValue(1);
    mocks.orderCount.mockResolvedValue(2);

    const resolves = await wouldUpgradeResolveLimits('org_1', 'STARTER', 'PRO');
    expect(resolves).toBe(true);
  });

  it('suggests the smallest plan that fits usage', async () => {
    mocks.productCount.mockResolvedValue(80);
    mocks.orderCount.mockResolvedValue(100);

    const suggestion = await getSuggestedPlan('org_1', 'FREE');
    expect(suggestion).toBe('STARTER');
  });

  it('suggests a lower plan when current plan is above needed capacity', async () => {
    mocks.productCount.mockResolvedValue(2);
    mocks.orderCount.mockResolvedValue(2);

    const suggestion = await getSuggestedPlan('org_1', 'STARTER');
    expect(suggestion).toBe('FREE');
  });

  it('suggests PRO for high usage that exceeds STARTER limits', async () => {
    mocks.productCount.mockResolvedValue(999_999);
    mocks.orderCount.mockResolvedValue(999_999);

    const suggestion = await getSuggestedPlan('org_1', 'STARTER');
    expect(suggestion).toBe('PRO');
  });
});
