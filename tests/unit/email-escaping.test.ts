import { describe, it, expect, vi, beforeEach } from 'vitest'

const send = vi.hoisted(() => vi.fn())

vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

async function loadEmail() {
  vi.resetModules()
  process.env.RESEND_API_KEY = 're_test_key'
  return import('@/lib/email')
}

const PAYLOAD = '<a href="https://evil.example/login">Verify your account</a><img src=x onerror=alert(1)>'

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', async () => {
    const { escapeHtml } = await loadEmail()
    expect(escapeHtml(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;')
  })

  it('leaves plain text untouched', async () => {
    const { escapeHtml } = await loadEmail()
    expect(escapeHtml('Jane Doe')).toBe('Jane Doe')
  })
})

describe('sendContactNotification', () => {
  beforeEach(() => {
    send.mockReset()
    send.mockResolvedValue({ data: { id: 'email_1' }, error: null })
  })

  it('renders contact form fields as text, not markup, in both emails', async () => {
    const { sendContactNotification } = await loadEmail()

    await sendContactNotification({
      name: PAYLOAD,
      email: 'attacker@example.com',
      subject: PAYLOAD,
      message: PAYLOAD,
    })

    expect(send).toHaveBeenCalledTimes(2)
    for (const [args] of send.mock.calls) {
      const html: string = args.html
      expect(html).not.toContain('<a href="https://evil.example')
      expect(html).not.toContain('<img src=x')
      expect(html).toContain('&lt;a href=&quot;https://evil.example/login&quot;&gt;')
    }
  })
})

describe('customer-name emails', () => {
  beforeEach(() => {
    send.mockReset()
    send.mockResolvedValue({ data: { id: 'email_1' }, error: null })
  })

  it('escapes the customer name in the order confirmation', async () => {
    const { sendOrderConfirmation } = await loadEmail()

    await sendOrderConfirmation('buyer@example.com', {
      orderId: 'order_1',
      items: [{ title: 'Bamboo Toothbrush', quantity: 1, price: 5 }],
      total: 5,
      customerName: PAYLOAD,
    })

    const html: string = send.mock.calls[0][0].html
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('Hi &lt;a href=')
  })
})
