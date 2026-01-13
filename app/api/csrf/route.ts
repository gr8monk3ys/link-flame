import { NextResponse } from 'next/server';
import { getCsrfToken } from '@/lib/csrf';

/**
 * CSRF Token API Endpoint
 *
 * GET /api/csrf
 *
 * Generates and returns a CSRF token for the current session.
 * The signed token is stored in an HTTP-only cookie, and the
 * token value is returned to the client to include in subsequent requests.
 *
 * **Usage:**
 * ```typescript
 * const response = await fetch('/api/csrf');
 * const { token } = await response.json();
 *
 * // Include token in POST requests
 * await fetch('/api/contact', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'X-CSRF-Token': token
 *   },
 *   body: JSON.stringify(data)
 * });
 * ```
 */
export async function GET() {
  try {
    const token = await getCsrfToken();

    return NextResponse.json({
      token,
      message: 'CSRF token generated successfully',
    });
  } catch (error) {
    console.error('[CSRF_API_ERROR]', error);

    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
      },
      { status: 500 }
    );
  }
}
