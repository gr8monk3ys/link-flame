/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * Provides CSRF token generation and validation for forms and API endpoints.
 * Uses a cryptographically secure token stored in HTTP-only cookies.
 *
 * **Usage:**
 *
 * Server-side (API routes):
 * ```typescript
 * import { validateCsrfToken } from '@/lib/csrf'
 *
 * export async function POST(request: Request) {
 *   const csrfValid = await validateCsrfToken(request)
 *   if (!csrfValid) {
 *     return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
 *   }
 *   // Process request...
 * }
 * ```
 *
 * Client-side (React components):
 * ```typescript
 * import { useCsrfToken } from '@/lib/csrf'
 *
 * const csrfToken = await fetch('/api/csrf').then(r => r.json())
 *
 * await fetch('/api/contact', {
 *   method: 'POST',
 *   headers: { 'X-CSRF-Token': csrfToken.token },
 *   body: JSON.stringify(data)
 * })
 * ```
 */

import { cookies } from 'next/headers';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { logger } from '@/lib/logger';
import { SECURITY } from '@/config/constants';

const CSRF_COOKIE_NAME = SECURITY.csrf.cookieName;
const CSRF_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-csrf';
const CSRF_TOKEN_LENGTH = SECURITY.csrf.tokenLength;
const CSRF_TOKEN_EXPIRY = SECURITY.csrf.tokenExpiry;

/**
 * Generate a cryptographically secure CSRF token
 *
 * The token is a combination of:
 * - Random bytes for uniqueness
 * - HMAC signature for validation
 * - Timestamp for expiry
 *
 * @returns Object containing the token and its signed version
 */
export function generateCsrfToken(): { token: string; signedToken: string; expiresAt: number } {
  // Generate random token
  const tokenValue = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const expiresAt = Date.now() + CSRF_TOKEN_EXPIRY;

  // Create signed version with HMAC
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(`${tokenValue}:${expiresAt}`)
    .digest('hex');

  const signedToken = `${tokenValue}:${expiresAt}:${signature}`;

  return {
    token: tokenValue,
    signedToken,
    expiresAt,
  };
}

/**
 * Verify that a CSRF token is valid
 *
 * Checks:
 * 1. Token format is correct
 * 2. Token signature is valid (not tampered with)
 * 3. Token has not expired
 *
 * @param token - The token to verify (from cookie)
 * @param providedToken - The token provided by the client (from header/body)
 * @returns true if token is valid, false otherwise
 */
export function verifyCsrfToken(token: string, providedToken: string): boolean {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) {
      return false;
    }

    const [tokenValue, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    // Check expiry
    if (Date.now() > expiresAt) {
      return false;
    }

    // Verify signature
    const expectedSignature = createHmac('sha256', CSRF_SECRET)
      .update(`${tokenValue}:${expiresAt}`)
      .digest('hex');

    // Use timing-safe comparison
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    const signaturesMatch = timingSafeEqual(signatureBuffer, expectedBuffer);

    // Verify the provided token matches the stored token
    const tokensMatch = tokenValue === providedToken;

    return signaturesMatch && tokensMatch;
  } catch (error) {
    logger.error('CSRF token verification error', error);
    return false;
  }
}

/**
 * Get or generate a CSRF token for the current session
 *
 * - Retrieves existing token from cookie if valid
 * - Generates new token if none exists or expired
 * - Sets HTTP-only cookie with token
 *
 * @returns The CSRF token to send to the client
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_COOKIE_NAME);

  // If token exists and is valid, return it
  if (existingToken) {
    try {
      const parts = existingToken.value.split(':');
      if (parts.length === 3) {
        const expiresAt = parseInt(parts[1], 10);
        if (Date.now() < expiresAt) {
          return parts[0]; // Return just the token value
        }
      }
    } catch (error) {
      // Token is invalid, generate new one
    }
  }

  // Generate new token
  const { token, signedToken, expiresAt } = generateCsrfToken();

  // Set cookie with signed token
  cookieStore.set(CSRF_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(expiresAt),
    path: '/',
  });

  return token;
}

/**
 * Validate CSRF token from request
 *
 * Checks the token from request header (X-CSRF-Token) or body (_csrf)
 * against the token stored in the cookie.
 *
 * @param request - The incoming HTTP request
 * @returns true if token is valid, false otherwise
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get(CSRF_COOKIE_NAME);

  if (!storedToken) {
    return false;
  }

  // Get token from header or body
  let providedToken: string | null = null;

  // Check header first (X-CSRF-Token)
  providedToken = request.headers.get('X-CSRF-Token');

  // If not in header, check body
  if (!providedToken) {
    try {
      const body = await request.clone().json();
      providedToken = body._csrf || body.csrfToken;
    } catch (error) {
      // Body might not be JSON, that's okay
    }
  }

  if (!providedToken) {
    return false;
  }

  return verifyCsrfToken(storedToken.value, providedToken);
}

/**
 * CSRF token validation middleware wrapper
 *
 * Use this to wrap API route handlers that need CSRF protection.
 *
 * @param handler - The API route handler function
 * @returns Wrapped handler with CSRF validation
 *
 * @example
 * ```typescript
 * import { withCsrfProtection } from '@/lib/csrf'
 *
 * export const POST = withCsrfProtection(async (request: Request) => {
 *   // Handler code - CSRF already validated
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */
export function withCsrfProtection(
  handler: (request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const isValid = await validateCsrfToken(request);

    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'CSRF_VALIDATION_FAILED',
          message: 'Invalid or missing CSRF token',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return handler(request);
  };
}

/**
 * Delete CSRF token cookie
 *
 * Use this when user logs out or session ends.
 */
export async function deleteCsrfToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
}
