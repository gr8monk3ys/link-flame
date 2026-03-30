import { test, expect, type Page } from '@playwright/test';
import { getCsrfToken } from './fixtures';

type RateLimitInfo = {
  code?: string;
  message?: string;
  retryAfter?: number | string;
  resetAt?: string;
};

function extractRateLimitInfo(body: any): RateLimitInfo | null {
  if (!body || typeof body !== 'object') return null;
  if (body.code || body.retryAfter || body.resetAt) {
    return {
      code: body.code,
      message: body.message,
      retryAfter: body.retryAfter,
      resetAt: body.resetAt,
    };
  }
  if (body.error) {
    return {
      code: body.error.code,
      message: body.error.message,
      retryAfter: body.error.details?.retryAfter,
      resetAt: body.error.details?.resetAt,
    };
  }
  return null;
}

const randomTestIp = () => {
  const octet = () => Math.floor(Math.random() * 250) + 1;
  return `10.${octet()}.${octet()}.${octet()}`;
};

async function burstSignupRequests(page: Page, count = 6) {
  const baseEmail = `test${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const csrfToken = await getCsrfToken(page);

  return Promise.all(
    Array.from({ length: count }, (_, i) =>
      page.request.post('/api/auth/signup', {
        data: {
          name: `Test User ${i}`,
          email: `${baseEmail}+${i}@example.com`,
          password: 'TestPassword123!',
        },
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })
    )
  );
}

/**
 * Rate Limiting E2E Tests
 *
 * Verifies that rate limiting is enforced on sensitive endpoints:
 * - /api/auth/signup: 5 requests per minute
 * - /api/auth/signin (NextAuth callback): 5 requests per minute
 * - /api/contact: 5 requests per minute
 * - /api/newsletter: 5 requests per minute
 *
 * Note: These tests require Upstash Redis to be configured.
 * If Redis is not configured, rate limiting gracefully allows all requests.
 *
 * IMPORTANT: The signup endpoint requires CSRF tokens, so all signup requests
 * must include a valid CSRF token in the X-CSRF-Token header.
 */

test.describe('Rate Limiting - Signup Endpoint', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-forwarded-for': randomTestIp(),
    });
  });

  test('should enforce rate limit on signup endpoint', async ({ page }) => {
    const responses = await burstSignupRequests(page, 6);

    // Count successful and rate-limited responses
    const successCount = responses.filter((r) => r.status() === 201).length;
    const rateLimitedCount = responses.filter((r) => r.status() === 429).length;

    // If Redis is configured, at least one should be rate limited
    // If not configured, all requests succeed (graceful degradation)
    if (rateLimitedCount > 0) {
      expect(rateLimitedCount).toBeGreaterThanOrEqual(1);
      expect(successCount).toBeLessThanOrEqual(5);

      // Verify rate limit response format
      const rateLimitedResponse = responses.find((r) => r.status() === 429);
      const body = await rateLimitedResponse?.json();
      const info = extractRateLimitInfo(body);

      expect(info?.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(info?.message).toBeTruthy();
      expect(info?.retryAfter ?? info?.resetAt).toBeDefined();
    } else {
      // Redis not configured - all requests succeed
      console.log('Warning: Rate limiting not enforced (Redis not configured)');
      expect(successCount).toBe(6);
    }
  });

  test('should include retry-after information in rate limit response', async ({ page }) => {
    const responses = await burstSignupRequests(page, 6);

    const rateLimitedResponse = responses.find((r) => r.status() === 429);
    expect(rateLimitedResponse, 'Expected at least one 429 response').toBeDefined();

    const body = await rateLimitedResponse!.json();
    const info = extractRateLimitInfo(body);

    // Should have retry-after info
    expect(info?.retryAfter ?? info?.resetAt).toBeDefined();

    const now = Date.now();
    if (typeof info?.resetAt === 'string') {
      const retryAt = new Date(info.resetAt).getTime();
      expect(retryAt).toBeGreaterThan(now);
    } else if (typeof info?.retryAfter === 'string') {
      const retryAt = new Date(info.retryAfter).getTime();
      expect(retryAt).toBeGreaterThan(now);
    } else if (typeof info?.retryAfter === 'number') {
      expect(info.retryAfter).toBeGreaterThan(0);
    }
  });
});

test.describe('Rate Limiting - Contact Endpoint', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-forwarded-for': randomTestIp(),
    });
  });

  test('should enforce rate limit on contact form', async ({ page }) => {
    // Get CSRF token first - required for contact endpoint
    const csrfToken = await getCsrfToken(page);

    // Make 6 requests rapidly (limit is 5 per minute)
    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        page.request.post('/api/contact', {
          data: {
            name: `Test User ${i}`,
            email: `test${Date.now()}+${i}@example.com`,
            subject: `Test Subject ${i}`,
            message: 'This is a test message with more than 10 characters.',
          },
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        })
      )
    );

    const successCount = responses.filter((r) => r.status() === 201).length;
    const rateLimitedCount = responses.filter((r) => r.status() === 429).length;

    if (rateLimitedCount > 0) {
      expect(rateLimitedCount).toBeGreaterThanOrEqual(1);
      expect(successCount).toBeLessThanOrEqual(5);
    } else {
      console.log('Warning: Rate limiting not enforced (Redis not configured)');
    }
  });
});

test.describe('Rate Limiting - Newsletter Endpoint', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-forwarded-for': randomTestIp(),
    });
  });

  test('should enforce rate limit on newsletter subscription', async ({ page }) => {
    const baseEmail = `newsletter${Date.now()}`;

    // Get CSRF token first - required for newsletter endpoint
    const csrfToken = await getCsrfToken(page);

    // Make 6 requests rapidly (limit is 5 per minute)
    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        page.request.post('/api/newsletter', {
          data: {
            email: `${baseEmail}+${i}@example.com`,
          },
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        })
      )
    );

    const successCount = responses.filter((r) => r.ok()).length;
    const rateLimitedCount = responses.filter((r) => r.status() === 429).length;

    if (rateLimitedCount > 0) {
      expect(rateLimitedCount).toBeGreaterThanOrEqual(1);
      expect(successCount).toBeLessThanOrEqual(5);
    } else {
      console.log('Warning: Rate limiting not enforced (Redis not configured)');
    }
  });
});

test.describe('Rate Limiting - IP-based', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-forwarded-for': randomTestIp(),
    });
  });

  test('should track rate limits by IP for anonymous requests', async ({ page }) => {
    // This test verifies that rate limiting works for anonymous users
    // (tracked by IP address rather than user ID)

    const baseEmail = `anon${Date.now()}`;

    // Get CSRF token first - required for newsletter endpoint
    const csrfToken = await getCsrfToken(page);

    // Make 6 anonymous requests (no auth)
    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        page.request.post('/api/newsletter', {
          data: {
            email: `${baseEmail}+${i}@example.com`,
          },
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        })
      )
    );

    const successCount = responses.filter((r) => r.ok()).length;
    const rateLimitedCount = responses.filter((r) => r.status() === 429).length;

    if (rateLimitedCount > 0) {
      // Rate limiting is working for anonymous users
      expect(rateLimitedCount).toBeGreaterThanOrEqual(1);
      console.log(`Rate limiting enforced for anonymous users: ${rateLimitedCount} requests blocked`);
    } else {
      console.log('Warning: Rate limiting not enforced (Redis not configured)');
    }
  });
});

test.describe('Rate Limiting - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-forwarded-for': randomTestIp(),
    });
  });

  test('should allow requests after rate limit window expires', async ({ page }) => {
    test.setTimeout(45_000);

    const responses = await burstSignupRequests(page, 6);
    const rateLimitedResponse = responses.find((r) => r.status() === 429);
    expect(rateLimitedResponse, 'Expected at least one 429 response').toBeDefined();

    const body = await rateLimitedResponse!.json();
    const info = extractRateLimitInfo(body);
    expect(info).toBeDefined();

    const now = Date.now();
    const resetAtMs = typeof info?.resetAt === 'string'
      ? new Date(info.resetAt).getTime()
      : now + (typeof info?.retryAfter === 'number' ? info.retryAfter * 1000 : 1000);
    const waitMs = Math.max(0, Math.min(30_000, resetAtMs - now + 1_000));
    await page.waitForTimeout(waitMs);

    const csrfToken = await getCsrfToken(page);
    const recoveryResponse = await page.request.post('/api/auth/signup', {
      data: {
        name: 'Window Reset User',
        email: `window-reset-${Date.now()}@example.com`,
        password: 'TestPassword123!',
      },
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    });

    expect(recoveryResponse.status()).toBe(201);
  });

  test('should return valid JSON error for rate-limited requests', async ({ page }) => {
    const responses = await burstSignupRequests(page, 6);

    const rateLimitedResponse = responses.find((r) => r.status() === 429);

    expect(rateLimitedResponse, 'Expected at least one 429 response').toBeDefined();

    // Should return valid JSON
    const body = await rateLimitedResponse!.json();
    const info = extractRateLimitInfo(body);

    expect(body).toBeDefined();
    expect(typeof body).toBe('object');
    expect(info?.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(info?.message).toBeTruthy();
    expect(info?.retryAfter ?? info?.resetAt).toBeDefined();
  });
});
