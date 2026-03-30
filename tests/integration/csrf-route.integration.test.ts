import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCsrfToken: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  getCsrfToken: mocks.getCsrfToken,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: mocks.loggerError,
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET } from '@/app/api/csrf/route';

describe('GET /api/csrf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns token payload on success', async () => {
    mocks.getCsrfToken.mockResolvedValueOnce('csrf-token-value');

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      token: 'csrf-token-value',
      message: 'CSRF token generated successfully',
    });
  });

  it('returns 500 payload when token generation fails', async () => {
    const error = new Error('token generation failed');
    mocks.getCsrfToken.mockRejectedValueOnce(error);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: 'Failed to generate CSRF token',
    });
    expect(mocks.loggerError).toHaveBeenCalledWith('Failed to generate CSRF token', error);
  });
});
