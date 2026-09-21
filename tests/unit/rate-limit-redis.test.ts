import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Covers the Redis-backed path of lib/rate-limit, which is the one production
 * actually uses. The module builds its Upstash client at import time from the
 * environment, so each test stubs the env, resets the module registry and
 * re-imports.
 */

const fake = vi.hoisted(() => {
  const values = new Map<string, number>();
  const expiries = new Map<string, number>();
  let failing = false;

  return {
    values,
    expiries,
    setFailing(value: boolean) {
      failing = value;
    },
    reset() {
      values.clear();
      expiries.clear();
      failing = false;
    },
    client: {
      async incr(key: string) {
        if (failing) throw new Error('upstash down');
        const next = (values.get(key) ?? 0) + 1;
        values.set(key, next);
        return next;
      },
      async pexpire(key: string, ms: number) {
        if (failing) throw new Error('upstash down');
        expiries.set(key, Date.now() + ms);
        return 1;
      },
      async pttl(key: string) {
        if (failing) throw new Error('upstash down');
        const expiresAt = expiries.get(key);
        if (expiresAt === undefined) return -1;
        return expiresAt - Date.now();
      },
      async del(key: string) {
        values.delete(key);
        expiries.delete(key);
        return 1;
      },
    },
  };
});

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(_config: { url: string; token: string }) {
      return fake.client as unknown as object;
    }
  },
}));

async function importRateLimit() {
  vi.resetModules();
  vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://fake.upstash.io');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'fake-token');
  return import('@/lib/rate-limit');
}

describe('Rate limiting over Redis', () => {
  beforeEach(() => {
    fake.reset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('counts requests under the versioned key prefix', async () => {
    const { checkRateLimit } = await importRateLimit();

    await checkRateLimit('ip:203.0.113.9');

    expect([...fake.values.keys()]).toEqual([
      'linkflame:ratelimit:v2:standard:ip:203.0.113.9',
    ]);
  });

  it('keeps the standard and strict buckets in separate keys', async () => {
    const { checkRateLimit, checkStrictRateLimit } = await importRateLimit();

    await checkRateLimit('ip:203.0.113.9');
    await checkStrictRateLimit('ip:203.0.113.9');

    expect([...fake.values.keys()].sort()).toEqual([
      'linkflame:ratelimit:v2:standard:ip:203.0.113.9',
      'linkflame:ratelimit:v2:strict:ip:203.0.113.9',
    ]);
  });

  it('blocks once the strict limit is exceeded', async () => {
    const { checkStrictRateLimit } = await importRateLimit();

    for (let i = 0; i < 5; i += 1) {
      expect((await checkStrictRateLimit('ip:198.51.100.4')).success).toBe(true);
    }

    const blocked = await checkStrictRateLimit('ip:198.51.100.4');
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.limit).toBe(5);
  });

  it('falls back to the in-memory limiter when Redis is unreachable', async () => {
    const { checkStrictRateLimit } = await importRateLimit();

    fake.setFailing(true);

    // Still limited, just per-instance: the request is answered rather than
    // becoming a 500, and the ceiling is still enforced.
    for (let i = 0; i < 5; i += 1) {
      expect((await checkStrictRateLimit('ip:192.0.2.44')).success).toBe(true);
    }
    expect((await checkStrictRateLimit('ip:192.0.2.44')).success).toBe(false);
    expect(fake.values.size).toBe(0);
  });

  it('falls back to the in-memory limiter for the standard bucket when Redis is unreachable', async () => {
    const { checkRateLimit } = await importRateLimit();

    fake.setFailing(true);

    // Same contract as the strict bucket: the standard ceiling (10 per 10s)
    // is still enforced from the in-memory limiter, no request becomes a 500,
    // and nothing is written to Redis while it is down.
    for (let i = 0; i < 10; i += 1) {
      expect((await checkRateLimit('ip:192.0.2.45')).success).toBe(true);
    }
    const blocked = await checkRateLimit('ip:192.0.2.45');
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.limit).toBe(10);
    expect(fake.values.size).toBe(0);
  });

  it('logs the Redis failure once per bucket and keeps serving', async () => {
    const { checkRateLimit, checkStrictRateLimit } = await importRateLimit();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    fake.setFailing(true);

    await checkRateLimit('ip:192.0.2.46');
    await checkRateLimit('ip:192.0.2.46');
    await checkStrictRateLimit('ip:192.0.2.46');
    await checkStrictRateLimit('ip:192.0.2.46');

    const messages = errorSpy.mock.calls.map((call) => String(call[0]));
    expect(messages.filter((m) => m.includes('(standard) failed'))).toHaveLength(1);
    expect(messages.filter((m) => m.includes('(strict) failed'))).toHaveLength(1);
  });
});
