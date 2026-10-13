import { describe, it, expect } from 'vitest'
import { getSafeCallbackUrl } from '@/lib/safe-redirect'

describe('getSafeCallbackUrl', () => {
  it.each([
    ['/checkout', '/checkout'],
    ['/account/orders?page=2', '/account/orders?page=2'],
    ['/products#reviews', '/products#reviews'],
    ['/', '/'],
  ])('allows same-origin path %s', (input, expected) => {
    expect(getSafeCallbackUrl(input)).toBe(expected)
  })

  it.each([
    'https://evil.com',
    'http://evil.com/checkout',
    '//evil.com',
    '//evil.com/checkout',
    '/\\evil.com',
    '\\\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'evil.com',
    ' /checkout',
  ])('rejects %j', (input) => {
    expect(getSafeCallbackUrl(input)).toBe('/')
  })

  it('falls back when the param is missing', () => {
    expect(getSafeCallbackUrl(null)).toBe('/')
    expect(getSafeCallbackUrl(undefined)).toBe('/')
    expect(getSafeCallbackUrl('')).toBe('/')
  })

  it('uses a custom fallback', () => {
    expect(getSafeCallbackUrl('https://evil.com', '/account')).toBe('/account')
  })
})
