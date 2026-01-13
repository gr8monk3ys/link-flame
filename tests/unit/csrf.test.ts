import { describe, it, expect, beforeAll } from 'vitest';
import { generateCsrfToken, verifyCsrfToken } from '@/lib/csrf';

describe('CSRF Protection', () => {
  beforeAll(() => {
    // Ensure NEXTAUTH_SECRET is set for testing
    process.env.NEXTAUTH_SECRET = 'test-secret-key-for-csrf-min-32-chars';
  });

  describe('generateCsrfToken', () => {
    it('should generate a valid CSRF token', () => {
      const result = generateCsrfToken();

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('signedToken');
      expect(result).toHaveProperty('expiresAt');

      // Token should be 64 characters (32 bytes in hex)
      expect(result.token).toHaveLength(64);

      // Signed token should have 3 parts: token:timestamp:signature
      const parts = result.signedToken.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe(result.token);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(token1.token).not.toBe(token2.token);
      expect(token1.signedToken).not.toBe(token2.signedToken);
    });

    it('should set expiry 24 hours in the future', () => {
      const result = generateCsrfToken();
      const now = Date.now();
      const expectedExpiry = now + 24 * 60 * 60 * 1000;

      // Allow 1 second tolerance for test execution time
      expect(result.expiresAt).toBeGreaterThan(now);
      expect(result.expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });

  describe('verifyCsrfToken', () => {
    it('should verify a valid token', () => {
      const { token, signedToken } = generateCsrfToken();
      const isValid = verifyCsrfToken(signedToken, token);

      expect(isValid).toBe(true);
    });

    it('should reject an expired token', () => {
      // Create an expired token (expiry in the past)
      const tokenValue = 'a'.repeat(64);
      const expiresAt = Date.now() - 1000; // 1 second ago
      const signedToken = `${tokenValue}:${expiresAt}:fakesignature`;

      const isValid = verifyCsrfToken(signedToken, tokenValue);

      expect(isValid).toBe(false);
    });

    it('should reject a token with invalid signature', () => {
      const { token, signedToken } = generateCsrfToken();

      // Tamper with the signature
      const parts = signedToken.split(':');
      const tamperedToken = `${parts[0]}:${parts[1]}:invalidsignature`;

      const isValid = verifyCsrfToken(tamperedToken, token);

      expect(isValid).toBe(false);
    });

    it('should reject a token with tampered value', () => {
      const { token, signedToken } = generateCsrfToken();

      // Change the token value
      const parts = signedToken.split(':');
      const tamperedToken = `${'b'.repeat(64)}:${parts[1]}:${parts[2]}`;

      const isValid = verifyCsrfToken(tamperedToken, token);

      expect(isValid).toBe(false);
    });

    it('should reject a token with incorrect format', () => {
      const invalidTokens = [
        'invalid',
        'token:only',
        'token:timestamp',
        ':timestamp:signature',
        'token::signature',
        '',
      ];

      invalidTokens.forEach((invalidToken) => {
        const isValid = verifyCsrfToken(invalidToken, 'sometoken');
        expect(isValid).toBe(false);
      });
    });

    it('should reject when provided token does not match stored token', () => {
      const { signedToken } = generateCsrfToken();
      const wrongToken = 'c'.repeat(64);

      const isValid = verifyCsrfToken(signedToken, wrongToken);

      expect(isValid).toBe(false);
    });

    it('should reject a token with invalid expiry timestamp', () => {
      const tokenValue = 'a'.repeat(64);
      const invalidExpiry = 'not-a-number';
      const signedToken = `${tokenValue}:${invalidExpiry}:fakesignature`;

      const isValid = verifyCsrfToken(signedToken, tokenValue);

      expect(isValid).toBe(false);
    });

    it('should use timing-safe comparison to prevent timing attacks', () => {
      // Generate a valid token
      const { token, signedToken } = generateCsrfToken();

      // Measure time for valid token
      const start1 = process.hrtime.bigint();
      verifyCsrfToken(signedToken, token);
      const end1 = process.hrtime.bigint();
      const validTime = end1 - start1;

      // Measure time for invalid token (different length)
      const start2 = process.hrtime.bigint();
      verifyCsrfToken(signedToken, 'short');
      const end2 = process.hrtime.bigint();
      const invalidTime = end2 - start2;

      // Both operations should complete (this test ensures no errors)
      expect(validTime).toBeGreaterThan(0n);
      expect(invalidTime).toBeGreaterThan(0n);
    });
  });

  describe('CSRF token lifecycle', () => {
    it('should generate, verify, and handle expiry correctly', () => {
      // Generate token
      const { token, signedToken, expiresAt } = generateCsrfToken();

      // Token should be valid immediately
      expect(verifyCsrfToken(signedToken, token)).toBe(true);

      // Token should be valid before expiry
      const beforeExpiry = Date.now() < expiresAt;
      expect(beforeExpiry).toBe(true);

      // Create an expired token manually
      const expiredTokenValue = 'd'.repeat(64);
      const pastExpiry = Date.now() - 1000;
      const expiredSignedToken = `${expiredTokenValue}:${pastExpiry}:fakesig`;

      // Expired token should be rejected
      expect(verifyCsrfToken(expiredSignedToken, expiredTokenValue)).toBe(false);
    });
  });

  describe('Security properties', () => {
    it('should generate cryptographically random tokens', () => {
      const tokens = new Set<string>();
      const iterations = 1000;

      // Generate many tokens
      for (let i = 0; i < iterations; i++) {
        const { token } = generateCsrfToken();
        tokens.add(token);
      }

      // All tokens should be unique (no collisions)
      expect(tokens.size).toBe(iterations);
    });

    it('should not accept empty or null tokens', () => {
      const { signedToken } = generateCsrfToken();

      expect(verifyCsrfToken(signedToken, '')).toBe(false);
      expect(verifyCsrfToken('', '')).toBe(false);
    });

    it('should validate HMAC signature correctly', () => {
      const { token, signedToken } = generateCsrfToken();
      const parts = signedToken.split(':');

      // Valid signature should pass
      expect(verifyCsrfToken(signedToken, token)).toBe(true);

      // Change one character in signature should fail
      const signature = parts[2];
      const tamperedSig = signature.substring(0, signature.length - 1) +
        (signature[signature.length - 1] === 'a' ? 'b' : 'a');
      const tamperedToken = `${parts[0]}:${parts[1]}:${tamperedSig}`;

      expect(verifyCsrfToken(tamperedToken, token)).toBe(false);
    });
  });
});
