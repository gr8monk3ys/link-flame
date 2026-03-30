import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SECURITY } from '@/config/constants';

// Mock nanoid before importing the module under test
const mockNanoid = vi.fn(() => 'V1StGXR8_Z5jdHi6B-myT123');
vi.mock('nanoid', () => ({
  nanoid: (size?: number) => mockNanoid(size),
}));

// Mock cookies from next/headers
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Import the module under test after mocks are set up
import {
  getGuestSessionId,
  getUserIdForCart,
  clearGuestSession,
} from '@/lib/session';

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock cookie store
    mockCookieStore.get.mockReset();
    mockCookieStore.set.mockReset();
    mockCookieStore.delete.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getGuestSessionId', () => {
    describe('Session ID Generation', () => {
      it('should generate new session ID when cookie is missing', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        const sessionId = await getGuestSessionId();

        expect(sessionId).toBeDefined();
        expect(typeof sessionId).toBe('string');
        expect(mockCookieStore.set).toHaveBeenCalled();
      });

      it('should return existing session ID from cookie', async () => {
        const existingSessionId = 'guest_existingSession123456';
        mockCookieStore.get.mockReturnValue({ value: existingSessionId });

        const sessionId = await getGuestSessionId();

        expect(sessionId).toBe(existingSessionId);
        expect(mockCookieStore.set).not.toHaveBeenCalled();
      });

      it('should prefix session ID with "guest_"', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        const sessionId = await getGuestSessionId();

        expect(sessionId).toMatch(/^guest_/);
        expect(sessionId.startsWith(SECURITY.session.guestSessionPrefix)).toBe(true);
      });

      it('should generate unique IDs on multiple calls when no cookie exists', async () => {
        const generatedIds: string[] = [];
        let callCount = 0;

        mockNanoid.mockImplementation(() => `unique_id_${++callCount}`);
        mockCookieStore.get.mockReturnValue(undefined);

        // Simulate multiple independent sessions (clear set mock between calls)
        for (let i = 0; i < 5; i++) {
          mockCookieStore.get.mockReturnValue(undefined);
          const sessionId = await getGuestSessionId();
          generatedIds.push(sessionId);
        }

        // All generated IDs should be unique
        const uniqueIds = new Set(generatedIds);
        expect(uniqueIds.size).toBe(5);
      });

      it('should call nanoid with size 24', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        await getGuestSessionId();

        expect(mockNanoid).toHaveBeenCalledWith(24);
      });
    });

    describe('Cookie Settings', () => {
      it('should set httpOnly flag to true', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        await getGuestSessionId();

        expect(mockCookieStore.set).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.objectContaining({
            httpOnly: true,
          })
        );
      });

      it('should set secure flag to false in test environment', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        await getGuestSessionId();

        expect(mockCookieStore.set).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.objectContaining({
            secure: false, // NODE_ENV is 'test' in vitest
          })
        );
      });

      it('should set sameSite to "lax"', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        await getGuestSessionId();

        expect(mockCookieStore.set).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.objectContaining({
            sameSite: 'lax',
          })
        );
      });

      it('should set correct maxAge (30 days in seconds)', async () => {
        mockCookieStore.get.mockReturnValue(undefined);
        const expectedMaxAge = SECURITY.session.guestSessionExpiry / 1000;

        await getGuestSessionId();

        expect(mockCookieStore.set).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.objectContaining({
            maxAge: expectedMaxAge,
          })
        );
      });

      it('should set path to "/"', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        await getGuestSessionId();

        expect(mockCookieStore.set).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.objectContaining({
            path: '/',
          })
        );
      });

      it('should set priority to "high"', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        await getGuestSessionId();

        expect(mockCookieStore.set).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.objectContaining({
            priority: 'high',
          })
        );
      });

      it('should use correct cookie name "guest_session_id"', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        await getGuestSessionId();

        expect(mockCookieStore.set).toHaveBeenCalledWith(
          'guest_session_id',
          expect.any(String),
          expect.any(Object)
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle cookie with empty string value', async () => {
        mockCookieStore.get.mockReturnValue({ value: '' });

        const sessionId = await getGuestSessionId();

        // Empty string is falsy, so should generate new session
        expect(sessionId).toMatch(/^guest_/);
        expect(mockCookieStore.set).toHaveBeenCalled();
      });

      it('should handle cookie with null value', async () => {
        mockCookieStore.get.mockReturnValue({ value: null });

        const sessionId = await getGuestSessionId();

        // null is falsy, so should generate new session
        expect(sessionId).toMatch(/^guest_/);
        expect(mockCookieStore.set).toHaveBeenCalled();
      });

      it('should read from correct cookie name', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        await getGuestSessionId();

        expect(mockCookieStore.get).toHaveBeenCalledWith('guest_session_id');
      });
    });
  });

  describe('getUserIdForCart', () => {
    describe('Authenticated User Handling', () => {
      it('should return authenticated user ID when provided', async () => {
        const authUserId = 'user_123456789';

        const result = await getUserIdForCart(authUserId);

        expect(result).toBe(authUserId);
        expect(mockCookieStore.get).not.toHaveBeenCalled();
        expect(mockCookieStore.set).not.toHaveBeenCalled();
      });

      it('should not access cookies when user is authenticated', async () => {
        const authUserId = 'user_abc123';

        await getUserIdForCart(authUserId);

        expect(mockCookieStore.get).not.toHaveBeenCalled();
      });

      it('should handle various user ID formats', async () => {
        const userIds = [
          'user_123',
          'cust_abc',
          '12345678-1234-1234-1234-123456789012', // UUID format
          'very_long_user_id_string_that_might_be_used',
        ];

        for (const userId of userIds) {
          const result = await getUserIdForCart(userId);
          expect(result).toBe(userId);
        }
      });
    });

    describe('Guest User Handling', () => {
      it('should return guest session ID when user is null', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        const result = await getUserIdForCart(null);

        expect(result).toMatch(/^guest_/);
      });

      it('should create new guest session when user is null and no cookie exists', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        await getUserIdForCart(null);

        expect(mockCookieStore.set).toHaveBeenCalled();
      });

      it('should return existing guest session when user is null and cookie exists', async () => {
        const existingSession = 'guest_existing123';
        mockCookieStore.get.mockReturnValue({ value: existingSession });

        const result = await getUserIdForCart(null);

        expect(result).toBe(existingSession);
        expect(mockCookieStore.set).not.toHaveBeenCalled();
      });
    });

    describe('Priority Handling', () => {
      it('should prioritize authenticated user over existing guest session', async () => {
        const authUserId = 'user_auth123';
        const existingGuestSession = 'guest_existing456';
        mockCookieStore.get.mockReturnValue({ value: existingGuestSession });

        const result = await getUserIdForCart(authUserId);

        expect(result).toBe(authUserId);
        expect(result).not.toBe(existingGuestSession);
      });

      it('should not modify guest session cookie when authenticated', async () => {
        const authUserId = 'user_authenticated';

        await getUserIdForCart(authUserId);

        expect(mockCookieStore.set).not.toHaveBeenCalled();
        expect(mockCookieStore.delete).not.toHaveBeenCalled();
      });
    });
  });

  describe('clearGuestSession', () => {
    it('should delete guest session cookie', async () => {
      await clearGuestSession();

      expect(mockCookieStore.delete).toHaveBeenCalledWith('guest_session_id');
    });

    it('should handle missing cookie gracefully', async () => {
      mockCookieStore.delete.mockImplementation(() => {
        // Simulating no error when cookie doesn't exist
        return undefined;
      });

      // Should not throw
      await expect(clearGuestSession()).resolves.toBeUndefined();
    });

    it('should not throw errors when called multiple times', async () => {
      await expect(clearGuestSession()).resolves.toBeUndefined();
      await expect(clearGuestSession()).resolves.toBeUndefined();
      await expect(clearGuestSession()).resolves.toBeUndefined();
    });

    it('should only delete the specific guest session cookie', async () => {
      await clearGuestSession();

      expect(mockCookieStore.delete).toHaveBeenCalledTimes(1);
      expect(mockCookieStore.delete).toHaveBeenCalledWith('guest_session_id');
      expect(mockCookieStore.delete).not.toHaveBeenCalledWith('csrf_token');
      expect(mockCookieStore.delete).not.toHaveBeenCalledWith('session');
    });
  });

  describe('Session ID Format Validation', () => {
    it('should generate session ID in expected format', async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      mockNanoid.mockReturnValue('ABCDEFGHIJKLMNOPQRSTUVWx');

      const sessionId = await getGuestSessionId();

      // Format should be: guest_ + 24 character nanoid
      expect(sessionId).toBe('guest_ABCDEFGHIJKLMNOPQRSTUVWx');
      expect(sessionId).toHaveLength(6 + 24); // "guest_" (6) + nanoid (24)
    });

    it('should use configured prefix from SECURITY constants', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const sessionId = await getGuestSessionId();

      expect(sessionId.startsWith(SECURITY.session.guestSessionPrefix)).toBe(true);
    });
  });

  describe('Cookie Configuration Constants', () => {
    it('should use SECURITY constants for expiry calculation', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await getGuestSessionId();

      const setCalls = mockCookieStore.set.mock.calls;
      expect(setCalls.length).toBeGreaterThan(0);

      const cookieOptions = setCalls[0][2];
      // maxAge should be guestSessionExpiry converted from ms to seconds
      expect(cookieOptions.maxAge).toBe(SECURITY.session.guestSessionExpiry / 1000);
    });

    it('should verify 30 day expiry is correctly configured', () => {
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      expect(SECURITY.session.guestSessionExpiry).toBe(thirtyDaysInMs);
    });

    it('should verify guest session prefix is correctly configured', () => {
      expect(SECURITY.session.guestSessionPrefix).toBe('guest_');
    });
  });

  describe('Integration Scenarios', () => {
    it('should support full guest-to-authenticated flow', async () => {
      // Step 1: Guest user visits site
      mockCookieStore.get.mockReturnValue(undefined);
      const guestSessionId = await getGuestSessionId();
      expect(guestSessionId).toMatch(/^guest_/);
      expect(mockCookieStore.set).toHaveBeenCalled();

      // Step 2: Guest adds items to cart (uses guest session)
      mockCookieStore.get.mockReturnValue({ value: guestSessionId });
      const cartUserId = await getUserIdForCart(null);
      expect(cartUserId).toBe(guestSessionId);

      // Step 3: User logs in (now use authenticated ID)
      const authUserId = 'user_authenticated_123';
      const authenticatedCartUserId = await getUserIdForCart(authUserId);
      expect(authenticatedCartUserId).toBe(authUserId);

      // Step 4: Clear guest session after migration
      vi.clearAllMocks();
      await clearGuestSession();
      expect(mockCookieStore.delete).toHaveBeenCalledWith('guest_session_id');
    });

    it('should handle returning authenticated user correctly', async () => {
      const authUserId = 'user_returning_123';

      // Authenticated user should never trigger cookie operations
      const result = await getUserIdForCart(authUserId);

      expect(result).toBe(authUserId);
      expect(mockCookieStore.get).not.toHaveBeenCalled();
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle returning guest user correctly', async () => {
      const existingGuestSession = 'guest_returning_456';
      mockCookieStore.get.mockReturnValue({ value: existingGuestSession });

      // Returning guest should get their existing session
      const result = await getUserIdForCart(null);

      expect(result).toBe(existingGuestSession);
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should propagate cookie read errors', async () => {
      const cookiesModule = await import('next/headers');
      vi.mocked(cookiesModule.cookies).mockRejectedValueOnce(
        new Error('Cookie access denied')
      );

      await expect(getGuestSessionId()).rejects.toThrow('Cookie access denied');
    });

    it('should propagate cookie set errors', async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie quota exceeded');
      });

      await expect(getGuestSessionId()).rejects.toThrow('Cookie quota exceeded');
    });

    it('should propagate cookie delete errors', async () => {
      mockCookieStore.delete.mockImplementation(() => {
        throw new Error('Cookie delete failed');
      });

      await expect(clearGuestSession()).rejects.toThrow('Cookie delete failed');
    });
  });

  describe('Security Considerations', () => {
    it('should use nanoid for secure random ID generation', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await getGuestSessionId();

      // nanoid is cryptographically secure
      expect(mockNanoid).toHaveBeenCalled();
    });

    it('should set httpOnly to prevent XSS access', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await getGuestSessionId();

      const setCalls = mockCookieStore.set.mock.calls;
      const cookieOptions = setCalls[0][2];
      expect(cookieOptions.httpOnly).toBe(true);
    });

    it('should set sameSite for CSRF protection', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await getGuestSessionId();

      const setCalls = mockCookieStore.set.mock.calls;
      const cookieOptions = setCalls[0][2];
      expect(cookieOptions.sameSite).toBe('lax');
    });

    it('should set cookie path to root for site-wide access', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await getGuestSessionId();

      const setCalls = mockCookieStore.set.mock.calls;
      const cookieOptions = setCalls[0][2];
      expect(cookieOptions.path).toBe('/');
    });
  });
});

describe('Production Environment Behavior', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should set secure flag based on NODE_ENV', async () => {
    // Note: This test documents expected behavior.
    // In actual production, secure should be true.
    // In test environment (current), secure is false.

    mockCookieStore.get.mockReturnValue(undefined);

    await getGuestSessionId();

    const setCalls = mockCookieStore.set.mock.calls;
    const cookieOptions = setCalls[0][2];

    // In test environment, secure should be false
    expect(cookieOptions.secure).toBe(process.env.NODE_ENV === 'production');
  });
});
