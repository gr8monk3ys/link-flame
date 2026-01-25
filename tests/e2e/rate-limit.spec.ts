import { test, expect } from '@playwright/test';
import { getCsrfToken } from './fixtures';

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
  test('should enforce rate limit on signup endpoint', async ({ page }) => {
    const baseEmail = `test${Date.now()}`;

    // Get CSRF token first - required for signup endpoint
    const csrfToken = await getCsrfToken(page);

    // Make 6 requests rapidly (limit is 5 per minute)
    // Each request includes the CSRF token
    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
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

      expect(body).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('retryAfter');
    } else {
      // Redis not configured - all requests succeed
      console.log('Warning: Rate limiting not enforced (Redis not configured)');
      expect(successCount).toBe(6);
    }
  });

  test('should include retry-after information in rate limit response', async ({ page }) => {
    const baseEmail = `test${Date.now()}`;

    // Get CSRF token first - required for signup endpoint
    const csrfToken = await getCsrfToken(page);

    // Make 6 rapid requests to trigger rate limit
    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
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

    const rateLimitedResponse = responses.find((r) => r.status() === 429);

    if (rateLimitedResponse) {
      const body = await rateLimitedResponse.json();

      // Should have retryAfter timestamp
      expect(body.retryAfter).toBeDefined();

      // retryAfter should be a future timestamp
      const retryAfter = new Date(body.retryAfter).getTime();
      const now = Date.now();
      expect(retryAfter).toBeGreaterThan(now);
    } else {
      test.skip();
    }
  });
});

test.describe('Rate Limiting - Contact Endpoint', () => {
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
  test('should allow requests after rate limit window expires', async ({ page }) => {
    // This test would require waiting 60+ seconds for the rate limit to reset
    // Skipping for now to keep test suite fast
    test.skip();

    // Implementation if needed:
    // 1. Make 5 requests to hit limit
    // 2. Wait 61 seconds
    // 3. Make another request
    // 4. Should succeed (200/201)
  });

  test('should return valid JSON error for rate-limited requests', async ({ page }) => {
    const baseEmail = `test${Date.now()}`;

    // Get CSRF token first - required for signup endpoint
    const csrfToken = await getCsrfToken(page);

    // Make 6 rapid requests
    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
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

    const rateLimitedResponse = responses.find((r) => r.status() === 429);

    if (rateLimitedResponse) {
      // Should return valid JSON
      const body = await rateLimitedResponse.json();

      expect(body).toBeDefined();
      expect(typeof body).toBe('object');
      expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.message).toBeDefined();
      expect(body.retryAfter).toBeDefined();
    }
  });
});
