/**
 * Redirect target validation.
 *
 * `callbackUrl` arrives in the query string, so anyone can craft a sign-in
 * link that points it at another site. Only same-origin relative paths are
 * followed; anything else falls back to a safe default.
 *
 * @module lib/safe-redirect
 */

// Placeholder origin used only to parse relative paths; never navigated to.
const PARSE_ORIGIN = 'https://link-flame.invalid'

/**
 * Return `raw` if it is a same-origin relative path, otherwise `fallback`.
 *
 * Rejects absolute URLs (`https://evil.com`), protocol-relative URLs
 * (`//evil.com`), backslash variants browsers normalize to `//`
 * (`/\evil.com`), `javascript:` URLs, and anything containing control
 * characters or whitespace.
 */
export function getSafeCallbackUrl(
  raw: string | null | undefined,
  fallback: string = '/'
): string {
  if (!raw) return fallback

  // Must start with a single slash; `//` and `/\` are protocol-relative.
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return fallback
  }

  // Browsers strip tabs/newlines while parsing URLs, which can turn
  // `/\t/evil.com` into `//evil.com`. Refuse any control char or whitespace.
  if (/[\u0000-\u001F\u007F\s\\]/.test(raw)) {
    return fallback
  }

  try {
    const parsed = new URL(raw, PARSE_ORIGIN)
    if (parsed.origin !== PARSE_ORIGIN) return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
