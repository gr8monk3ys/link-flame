/**
 * Browser half of the CSRF double-submit scheme in `lib/csrf.ts`.
 *
 * `GET /api/csrf` sets the signed, HTTP-only `csrf_token` cookie and returns
 * the bare token as `{ token }`. Mutating routes call `validateCsrfToken`,
 * which compares the `X-CSRF-Token` header against that cookie and answers
 * 403 `CSRF_VALIDATION_FAILED` when either is missing.
 *
 * Fetch the token when the user submits, not on mount: the footer newsletter
 * form is on every page and must not add a request to every page load.
 *
 * ```ts
 * const token = await fetchCsrfToken()
 * await fetch('/api/contact', {
 *   method: 'POST',
 *   headers: csrfHeaders(token, { 'Content-Type': 'application/json' }),
 *   body: JSON.stringify(data),
 * })
 * ```
 */

export const CSRF_HEADER_NAME = 'X-CSRF-Token'

/** Shown when the token request itself fails; safe to render to the user. */
export const CSRF_FETCH_ERROR_MESSAGE =
  'Could not start a secure session. Refresh the page and try again.'

/**
 * Get a CSRF token for the current browser session.
 *
 * Throws an `Error` with a user-presentable message when `/api/csrf` is
 * unreachable, answers a non-2xx status, or returns no `token` string.
 */
export async function fetchCsrfToken(): Promise<string> {
  let response: Response
  try {
    // Same-origin credentials so the response's Set-Cookie is stored; no-store
    // so a cached body is never paired with a cookie the server has rotated.
    response = await fetch('/api/csrf', { credentials: 'same-origin', cache: 'no-store' })
  } catch {
    throw new Error(CSRF_FETCH_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw new Error(`${CSRF_FETCH_ERROR_MESSAGE} (HTTP ${response.status})`)
  }

  const data: unknown = await response.json().catch(() => null)
  const token =
    data && typeof data === 'object' && typeof (data as { token?: unknown }).token === 'string'
      ? (data as { token: string }).token
      : ''

  if (!token) {
    throw new Error(CSRF_FETCH_ERROR_MESSAGE)
  }

  return token
}

/**
 * Request headers carrying the CSRF token, merged over any `headers` given.
 */
export function csrfHeaders(
  token: string,
  headers: Record<string, string> = {}
): Record<string, string> {
  return { ...headers, [CSRF_HEADER_NAME]: token }
}

/**
 * The `error.message` of a `lib/api-response` error body, if the payload has
 * one. Used to show the route's own message (for example the 403 CSRF text)
 * instead of a generic fallback.
 */
export function apiErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const error = (payload as { error?: unknown }).error
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return undefined
}
