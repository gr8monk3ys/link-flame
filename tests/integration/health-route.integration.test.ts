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
    vi.unstubAllEnvs();
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

  it('returns 503 naming what is missing when production cannot take money', async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ ok: 1 }]);
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_value_not_to_leak');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('EMAIL_FROM', 'orders@example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_EMAIL', 'help@example.com');

    const response = await GET();
    const body = await response.text();
    const payload = JSON.parse(body);

    expect(response.status).toBe(503);
    expect(payload.error.code).toBe('NOT_READY');
    expect(payload.error.details).toEqual({
      checks: { db: 'up', config: 'not-ready' },
      issues: [
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is a test-mode key',
        'RESEND_API_KEY is missing',
      ],
    });
    expect(body).not.toContain('value_not_to_leak');
  });

  it('returns 200 in production when configured to take money', async () => {
    mocks.queryRaw.mockResolvedValueOnce([{ ok: 1 }]);
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_live_x');
    vi.stubEnv('RESEND_API_KEY', 're_x');
    vi.stubEnv('EMAIL_FROM', 'orders@example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPPORT_EMAIL', 'help@example.com');

    const response = await GET();

    expect(response.status).toBe(200);
  });
});
