import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Regression test for the /products outage.
 *
 * With Upstash credentials configured, `lib/rate-limit` builds a real
 * `Ratelimit`. When that limiter throws — as it did in production, with
 * `TypeError: s.map is not a function` out of the Upstash REST pipeline —
 * every route that rate limits before its own try/catch returned a bodyless
 * 500, and the catalogue page rendered "No products found".
 *
 * The limiter must fail open onto the in-memory limiter instead.
 */

const standardLimit = vi.fn();
const strictLimit = vi.fn();

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(_config: unknown) {}
  },
}));

vi.mock('@upstash/ratelimit', () => {
  class Ratelimit {
    limit: (id: string) => Promise<unknown>;

    constructor(config: { limiter: { bucket: string } }) {
      this.limit = config.limiter.bucket === 'strict' ? strictLimit : standardLimit;
    }

    static slidingWindow(max: number, _window: string) {
      // The standard limiter is the only one built with a hard-coded 10.
      return { bucket: max === 10 ? 'standard' : 'strict' };
    }
  }

  return { Ratelimit };
});

async function loadRateLimitWithRedisConfigured() {
  process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  vi.resetModules();
  return import('@/lib/rate-limit');
}

describe('rate limiting fails open when Redis misbehaves', () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    standardLimit.mockReset();
    strictLimit.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    vi.restoreAllMocks();
  });

  it('uses the Redis verdict while Redis is healthy', async () => {
    standardLimit.mockResolvedValue({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 1234,
    });

    const { checkRateLimit } = await loadRateLimitWithRedisConfigured();

    await expect(checkRateLimit('ip:1.2.3.4')).resolves.toEqual({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 1234,
    });
  });

  it('allows the request when the standard limiter throws', async () => {
    standardLimit.mockRejectedValue(new TypeError('s.map is not a function'));

    const { checkRateLimit } = await loadRateLimitWithRedisConfigured();
    const result = await checkRateLimit('products:ip:1.2.3.4');

    expect(standardLimit).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(result.reset).toBeGreaterThan(Date.now());
  });

  it('allows the request when the strict limiter throws', async () => {
    strictLimit.mockRejectedValue(new TypeError('s.map is not a function'));

    const { checkStrictRateLimit } = await loadRateLimitWithRedisConfigured();
    const result = await checkStrictRateLimit('login:ip:1.2.3.4');

    expect(strictLimit).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
    expect(result.limit).toBeGreaterThan(0);
  });

  it('still enforces a local limit while Redis is down', async () => {
    standardLimit.mockRejectedValue(new Error('ECONNREFUSED'));

    const { checkRateLimit } = await loadRateLimitWithRedisConfigured();

    const verdicts = [];
    for (let i = 0; i < 12; i += 1) {
      verdicts.push(await checkRateLimit('flood:ip:9.9.9.9'));
    }

    expect(verdicts.slice(0, 10).every((v) => v.success)).toBe(true);
    expect(verdicts[10].success).toBe(false);
    expect(verdicts[11].success).toBe(false);
  });
});
