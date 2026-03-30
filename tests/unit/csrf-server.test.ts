import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mocks.cookieGet,
    set: mocks.cookieSet,
    delete: mocks.cookieDelete,
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const originalNodeEnv = process.env.NODE_ENV;
const originalSecret = process.env.NEXTAUTH_SECRET;

async function importCsrfFresh() {
  vi.resetModules();
  return import('@/lib/csrf');
}

describe('csrf server helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.NEXTAUTH_SECRET = 'test-secret-key-for-csrf-server-tests';
    mocks.cookieGet.mockReturnValue(undefined);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.NEXTAUTH_SECRET = originalSecret;
    vi.resetModules();
  });

  it('returns existing non-expired token from cookie', async () => {
    const future = Date.now() + 60_000;
    mocks.cookieGet.mockReturnValue({ value: `existing-token:${future}:sig` });
    const { getCsrfToken } = await importCsrfFresh();

    const token = await getCsrfToken();

    expect(token).toBe('existing-token');
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });

  it('generates and stores a token when cookie is missing or expired', async () => {
    mocks.cookieGet.mockReturnValue({ value: `expired-token:${Date.now() - 5_000}:sig` });
    const { getCsrfToken } = await importCsrfFresh();

    const token = await getCsrfToken();

    expect(token).toHaveLength(64);
    expect(mocks.cookieSet).toHaveBeenCalledTimes(1);
    expect(mocks.cookieSet.mock.calls[0][0]).toBe('csrf_token');
    expect(typeof mocks.cookieSet.mock.calls[0][1]).toBe('string');
  });

  it('validates token from request header', async () => {
    const { generateCsrfToken, validateCsrfToken } = await importCsrfFresh();
    const { token, signedToken } = generateCsrfToken();
    mocks.cookieGet.mockReturnValue({ value: signedToken });

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': token,
      },
      body: JSON.stringify({ message: 'hello' }),
    });

    const isValid = await validateCsrfToken(request);
    expect(isValid).toBe(true);
  });

  it('validates token from request body when header is missing', async () => {
    const { generateCsrfToken, validateCsrfToken } = await importCsrfFresh();
    const { token, signedToken } = generateCsrfToken();
    mocks.cookieGet.mockReturnValue({ value: signedToken });

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ _csrf: token, message: 'hello' }),
    });

    const isValid = await validateCsrfToken(request);
    expect(isValid).toBe(true);
  });

  it('rejects invalid or missing tokens', async () => {
    const { generateCsrfToken, validateCsrfToken } = await importCsrfFresh();
    const { signedToken } = generateCsrfToken();

    mocks.cookieGet.mockReturnValue(undefined);
    const missingCookieRequest = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'x-csrf-token': 'missing' },
    });
    expect(await validateCsrfToken(missingCookieRequest)).toBe(false);

    mocks.cookieGet.mockReturnValue({ value: signedToken });
    const invalidBodyRequest = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'not-json',
    });
    expect(await validateCsrfToken(invalidBodyRequest)).toBe(false);
  });

  it('returns 403 response from requireCsrf when invalid', async () => {
    const { requireCsrf } = await importCsrfFresh();
    mocks.cookieGet.mockReturnValue(undefined);
    const request = new Request('http://localhost/api/checkout', { method: 'POST' });

    const response = await requireCsrf(request);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(403);
    const body = await response?.json();
    expect(body?.error?.code).toBe('CSRF_VALIDATION_FAILED');
  });

  it('returns null from requireCsrf when valid', async () => {
    const { requireCsrf, generateCsrfToken } = await importCsrfFresh();
    const { token, signedToken } = generateCsrfToken();
    mocks.cookieGet.mockReturnValue({ value: signedToken });

    const request = new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: { 'x-csrf-token': token },
    });

    const response = await requireCsrf(request);
    expect(response).toBeNull();
  });

  it('wraps handlers with CSRF validation middleware', async () => {
    const { withCsrfProtection, generateCsrfToken } = await importCsrfFresh();
    const { token, signedToken } = generateCsrfToken();

    mocks.cookieGet.mockReturnValue({ value: signedToken });
    const okHandler = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const wrapped = withCsrfProtection(okHandler);
    const okResponse = await wrapped(
      new Request('http://localhost/api/secure', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
      })
    );
    expect(okResponse.status).toBe(200);
    expect(okHandler).toHaveBeenCalledTimes(1);

    mocks.cookieGet.mockReturnValue(undefined);
    const deniedResponse = await wrapped(new Request('http://localhost/api/secure', { method: 'POST' }));
    expect(deniedResponse.status).toBe(403);
  });

  it('deletes CSRF token cookie', async () => {
    const { deleteCsrfToken } = await importCsrfFresh();
    await deleteCsrfToken();
    expect(mocks.cookieDelete).toHaveBeenCalledWith('csrf_token');
  });

  it('throws in production when NEXTAUTH_SECRET is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.NEXTAUTH_SECRET;
    const { generateCsrfToken } = await importCsrfFresh();

    expect(() => generateCsrfToken()).toThrowError(
      /NEXTAUTH_SECRET environment variable is required in production/i
    );
  });
});
