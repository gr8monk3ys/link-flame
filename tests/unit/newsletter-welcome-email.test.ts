import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const send = vi.hoisted(() => vi.fn())

vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

async function loadEmail(env: Record<string, string | undefined> = {}) {
  vi.resetModules()
  process.env.RESEND_API_KEY = 're_test_key'
  process.env.EMAIL_FROM = 'shop@example.test'
  process.env.NEXT_PUBLIC_URL = 'https://shop.example.test'
  delete process.env.EMAIL_POSTAL_ADDRESS
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  return import('@/lib/email')
}

describe('newsletter welcome email', () => {
  const savedUrl = process.env.NEXT_PUBLIC_URL

  beforeEach(() => {
    send.mockReset()
    send.mockResolvedValue({ data: { id: 'email_1' }, error: null })
  })

  afterEach(() => {
    if (savedUrl === undefined) delete process.env.NEXT_PUBLIC_URL
    else process.env.NEXT_PUBLIC_URL = savedUrl
    delete process.env.EMAIL_POSTAL_ADDRESS
  })

  it('links the free guide and a working unsubscribe page', async () => {
    const { generateNewsletterConfirmationHTML } = await loadEmail()
    const html = generateNewsletterConfirmationHTML(
      'reader@example.test',
      'https://shop.example.test/unsubscribe?id=sub-1&t=abc'
    )

    expect(html).toContain('https://shop.example.test/downloads/link-flame-the-first-count.pdf')
    expect(html).toContain('https://shop.example.test/unsubscribe?id=sub-1&amp;t=abc')
    // The old template promised weekly emails and deals. Neither exists.
    expect(html.toLowerCase()).not.toContain('weekly')
    expect(html.toLowerCase()).not.toContain('exclusive')
  })

  it('prints the postal address only when one is configured', async () => {
    const without = await loadEmail()
    expect(
      without.generateNewsletterConfirmationHTML('reader@example.test', 'https://x.test/u')
    ).not.toContain('Example Street')

    const withAddress = await loadEmail({ EMAIL_POSTAL_ADDRESS: '1 Example Street, Los Angeles, CA' })
    expect(
      withAddress.generateNewsletterConfirmationHTML('reader@example.test', 'https://x.test/u')
    ).toContain('1 Example Street, Los Angeles, CA')
  })

  it('sends with a List-Unsubscribe header for the subscription', async () => {
    const { sendNewsletterConfirmation } = await loadEmail()
    await sendNewsletterConfirmation('reader@example.test', 'sub-1')

    expect(send).toHaveBeenCalledTimes(1)
    const message = send.mock.calls[0][0]
    expect(message.to).toBe('reader@example.test')
    expect(message.headers['List-Unsubscribe']).toMatch(
      /^<https:\/\/shop\.example\.test\/unsubscribe\?id=sub-1&t=[A-Za-z0-9_-]+>$/
    )
    // The address is never put in a URL.
    expect(message.html).not.toContain('email=reader')
  })
})
