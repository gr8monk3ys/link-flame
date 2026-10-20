import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NewsletterSignup } from '@/components/shared/newsletter-signup'

type Call = [string, RequestInit | undefined]

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const csrfForbidden = {
  success: false,
  error: { message: 'Invalid or missing CSRF token', code: 'CSRF_VALIDATION_FAILED' },
  meta: { timestamp: '2026-10-13T00:00:00.000Z' },
}

describe('NewsletterSignup', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let newsletterResponse: () => Response

  beforeEach(() => {
    newsletterResponse = () =>
      jsonResponse(
        {
          success: true,
          data: { email: 'a@b.co', subscriptionId: 'sub-1' },
          meta: { timestamp: '2026-10-13T00:00:00.000Z', message: 'Successfully subscribed to newsletter' },
        },
        201
      )
    fetchMock = vi.fn(async (url: string) => {
      if (url === '/api/csrf') {
        return jsonResponse({ token: 'tok-newsletter', message: 'CSRF token generated successfully' })
      }
      if (url === '/api/newsletter') {
        return newsletterResponse()
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function submit(email = 'a@b.co') {
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } })
    const form = screen.getByRole('button', { name: 'Subscribe' }).closest('form')
    if (!form) throw new Error('newsletter form not rendered')
    fireEvent.submit(form)
  }

  it('does not request a CSRF token on mount', () => {
    render(<NewsletterSignup />)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches /api/csrf first and POSTs with the returned X-CSRF-Token', async () => {
    render(<NewsletterSignup />)
    submit()

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())

    const calls = fetchMock.mock.calls as unknown as Call[]
    expect(calls).toHaveLength(2)
    expect(calls[0][0]).toBe('/api/csrf')

    const [url, init] = calls[1]
    expect(url).toBe('/api/newsletter')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({
      'Content-Type': 'application/json',
      'X-CSRF-Token': 'tok-newsletter',
    })
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'a@b.co' })

    expect(screen.getByRole('status')).toHaveTextContent('Successfully subscribed to newsletter')
    expect(screen.getByLabelText('Email address')).toHaveValue('')
  })

  it("renders the server's message when the route answers 403", async () => {
    newsletterResponse = () => jsonResponse(csrfForbidden, 403)
    render(<NewsletterSignup />)
    submit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Invalid or missing CSRF token')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows a readable error when the CSRF token cannot be fetched', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === '/api/csrf' ? new Response('', { status: 500 }) : newsletterResponse()
    )
    render(<NewsletterSignup />)
    submit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Could not start a secure session/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
