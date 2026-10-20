import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  CSRF_FETCH_ERROR_MESSAGE,
  CSRF_HEADER_NAME,
  apiErrorMessage,
  csrfHeaders,
  fetchCsrfToken,
} from '@/lib/csrf-client'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('fetchCsrfToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('GETs /api/csrf with same-origin credentials and returns the token', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ token: 'abc123', message: 'ok' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchCsrfToken()).resolves.toBe('abc123')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/csrf')
    expect(init.credentials).toBe('same-origin')
    expect(init.method ?? 'GET').toBe('GET')
  })

  it('throws a clear error when the route answers a non-2xx status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'nope' }, 500)))

    await expect(fetchCsrfToken()).rejects.toThrow(CSRF_FETCH_ERROR_MESSAGE)
    await expect(fetchCsrfToken()).rejects.toThrow(/HTTP 500/)
  })

  it('throws when the response carries no token string', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'no token here' })))
    await expect(fetchCsrfToken()).rejects.toThrow(CSRF_FETCH_ERROR_MESSAGE)

    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ token: 42 })))
    await expect(fetchCsrfToken()).rejects.toThrow(CSRF_FETCH_ERROR_MESSAGE)

    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 200 })))
    await expect(fetchCsrfToken()).rejects.toThrow(CSRF_FETCH_ERROR_MESSAGE)
  })

  it('throws a user-presentable error when the network request itself fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      })
    )

    await expect(fetchCsrfToken()).rejects.toThrow(CSRF_FETCH_ERROR_MESSAGE)
  })
})

describe('csrfHeaders', () => {
  it('returns just the token header by default', () => {
    expect(csrfHeaders('tok')).toEqual({ [CSRF_HEADER_NAME]: 'tok' })
    expect(CSRF_HEADER_NAME).toBe('X-CSRF-Token')
  })

  it('merges the token over the given headers without mutating them', () => {
    const base = { 'Content-Type': 'application/json' }
    const merged = csrfHeaders('tok', base)

    expect(merged).toEqual({ 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' })
    expect(base).toEqual({ 'Content-Type': 'application/json' })
  })
})

describe('apiErrorMessage', () => {
  it('reads error.message from a lib/api-response error body', () => {
    expect(
      apiErrorMessage({
        success: false,
        error: { message: 'Invalid or missing CSRF token', code: 'CSRF_VALIDATION_FAILED' },
      })
    ).toBe('Invalid or missing CSRF token')
  })

  it('accepts a plain string error', () => {
    expect(apiErrorMessage({ error: 'Something failed' })).toBe('Something failed')
  })

  it('returns undefined for anything else', () => {
    expect(apiErrorMessage(null)).toBeUndefined()
    expect(apiErrorMessage(undefined)).toBeUndefined()
    expect(apiErrorMessage('string')).toBeUndefined()
    expect(apiErrorMessage({})).toBeUndefined()
    expect(apiErrorMessage({ error: { code: 'X' } })).toBeUndefined()
    expect(apiErrorMessage({ error: { message: '' } })).toBeUndefined()
  })
})
