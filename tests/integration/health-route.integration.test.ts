import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mocks.loggerError,
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns healthy status when DB check succeeds', async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ ok: 1 }]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({
      ok: true,
      checks: {
        db: 'up',
      },
    });
    expect(payload.meta.durationMs).toEqual(expect.any(Number));
  });

  it('returns unhealthy status when DB check fails', async () => {
    const error = new Error('db down');
    mocks.queryRaw.mockRejectedValueOnce(error);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe('UNHEALTHY');
    expect(payload.error.message).toBe('Service unhealthy');
    expect(mocks.loggerError).toHaveBeenCalledWith('Health check failed', error);
  });
});
