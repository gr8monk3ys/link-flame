import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getIdentifier, checkRateLimit, checkStrictRateLimit } from '@/lib/rate-limit';

describe('Rate Limiting Utilities', () => {
  beforeEach(() => {
    // Mock console.warn to avoid cluttering test output
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('getIdentifier', () => {
    it('should use user ID when provided', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const identifier = getIdentifier(request, 'user123');

      expect(identifier).toBe('user:user123');
    });

    it('should use IP from x-forwarded-for when no user ID', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const identifier = getIdentifier(request, null);

      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should trim whitespace from forwarded IP', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '  192.168.1.1  , 10.0.0.1',
        },
      });

      const identifier = getIdentifier(request, null);

      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('should fallback to x-real-ip when x-forwarded-for is not available', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '10.0.0.5',
        },
      });

      const identifier = getIdentifier(request, null);

      expect(identifier).toBe('ip:10.0.0.5');
    });

    it('should use "unknown" when neither IP header is available', () => {
      const request = new Request('http://localhost:3000/api/test');

      const identifier = getIdentifier(request, null);

      expect(identifier).toBe('ip:unknown');
    });

    it('should prioritize user ID over IP even when IP is available', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '10.0.0.1',
        },
      });

      const identifier = getIdentifier(request, 'user456');

      expect(identifier).toBe('user:user456');
    });

    it('should handle empty x-forwarded-for header', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '',
        },
      });

      const identifier = getIdentifier(request, null);

      // Should fallback to unknown when forwarded-for is empty
      expect(identifier).toBe('ip:unknown');
    });

    it('should handle multiple IPs in x-forwarded-for and use first one', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.0.2.1',
        },
      });

      const identifier = getIdentifier(request, null);

      expect(identifier).toBe('ip:203.0.113.1');
    });

    it('should handle IPv6 addresses', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
      });

      const identifier = getIdentifier(request, null);

      expect(identifier).toBe('ip:2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('should work with different user ID formats', () => {
      const testCases = [
        'clerk_abc123',
        'user_xyz789',
        '12345',
        'email@example.com',
      ];

      testCases.forEach((userId) => {
        const request = new Request('http://localhost:3000/api/test');
        const identifier = getIdentifier(request, userId);
        expect(identifier).toBe(`user:${userId}`);
      });
    });
  });

  describe('checkRateLimit (graceful degradation)', () => {
    it('should allow all requests when Redis is not configured', async () => {
      // In test environment, Redis credentials are not set
      const result = await checkRateLimit('test-identifier');

      expect(result.success).toBe(true);
      expect(result.limit).toBe(Infinity);
      expect(result.remaining).toBe(Infinity);
      expect(result.reset).toBe(0);
    });

    it('should warn when rate limiting is not configured', async () => {
      await checkRateLimit('test-identifier');

      // Logger formats output as "[WARN] message" with additional metadata
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Rate limiting is not configured'),
        expect.anything()
      );
    });

    it('should accept any identifier format', async () => {
      const identifiers = [
        'user:123',
        'ip:192.168.1.1',
        'session:abc',
        'custom:identifier',
      ];

      for (const identifier of identifiers) {
        const result = await checkRateLimit(identifier);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('checkStrictRateLimit (graceful degradation)', () => {
    it('should allow all requests when Redis is not configured', async () => {
      const result = await checkStrictRateLimit('test-identifier');

      expect(result.success).toBe(true);
      expect(result.limit).toBe(Infinity);
      expect(result.remaining).toBe(Infinity);
      expect(result.reset).toBe(0);
    });

    it('should warn when rate limiting is not configured', async () => {
      await checkStrictRateLimit('test-identifier');

      // Logger formats output as "[WARN] message" with additional metadata
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Rate limiting is not configured'),
        expect.anything()
      );
    });

    it('should accept any identifier format', async () => {
      const identifiers = [
        'user:456',
        'ip:10.0.0.1',
        'admin:789',
      ];

      for (const identifier of identifiers) {
        const result = await checkStrictRateLimit(identifier);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Rate limit response structure', () => {
    it('should return consistent response structure from checkRateLimit', async () => {
      const result = await checkRateLimit('test');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('reset');

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.limit).toBe('number');
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.reset).toBe('number');
    });

    it('should return consistent response structure from checkStrictRateLimit', async () => {
      const result = await checkStrictRateLimit('test');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('reset');

      expect(typeof result.success).toBe('boolean');
      expect(typeof result.limit).toBe('number');
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.reset).toBe('number');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle authenticated user request flow', async () => {
      const request = new Request('http://localhost:3000/api/protected', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const userId = 'user123';
      const identifier = getIdentifier(request, userId);

      expect(identifier).toBe('user:user123');

      const rateLimitResult = await checkRateLimit(identifier);
      expect(rateLimitResult.success).toBe(true);
    });

    it('should handle anonymous user request flow', async () => {
      const request = new Request('http://localhost:3000/api/public', {
        headers: {
          'x-forwarded-for': '203.0.113.1',
        },
      });

      const identifier = getIdentifier(request, null);

      expect(identifier).toBe('ip:203.0.113.1');

      const rateLimitResult = await checkStrictRateLimit(identifier);
      expect(rateLimitResult.success).toBe(true);
    });

    it('should handle sensitive endpoint with strict rate limit', async () => {
      const request = new Request('http://localhost:3000/api/auth/signin', {
        headers: {
          'x-real-ip': '10.0.0.5',
        },
      });

      const identifier = getIdentifier(request, null);
      const result = await checkStrictRateLimit(identifier);

      expect(identifier).toBe('ip:10.0.0.5');
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('reset');
    });
  });
});
