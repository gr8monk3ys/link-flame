import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContactPage from '@/app/contact/page'

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

const filled = {
  name: 'Ada',
  email: 'ada@example.com',
  subject: 'Hello',
  message: 'A message long enough to pass validation.',
}

describe('ContactPage form', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let contactResponse: () => Response

  beforeEach(() => {
    contactResponse = () =>
      jsonResponse(
        {
          success: true,
          data: { message: "Thank you for contacting us! We'll get back to you soon.", id: 'c-1' },
          meta: { timestamp: '2026-10-13T00:00:00.000Z' },
        },
        201
      )
    fetchMock = vi.fn(async (url: string) => {
      if (url === '/api/csrf') {
        return jsonResponse({ token: 'tok-contact', message: 'CSRF token generated successfully' })
      }
      if (url === '/api/contact') {
        return contactResponse()
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function fillAndSubmit() {
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: filled.name } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: filled.email } })
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: filled.subject } })
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: filled.message } })
    const form = screen.getByRole('button', { name: 'Send Message' }).closest('form')
    if (!form) throw new Error('contact form not rendered')
    fireEvent.submit(form)
  }

  it('does not request a CSRF token on mount', () => {
    render(<ContactPage />)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches /api/csrf first and POSTs with the returned X-CSRF-Token', async () => {
    render(<ContactPage />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())

    const calls = fetchMock.mock.calls as unknown as Call[]
    expect(calls).toHaveLength(2)
    expect(calls[0][0]).toBe('/api/csrf')

    const [url, init] = calls[1]
    expect(url).toBe('/api/contact')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({
      'Content-Type': 'application/json',
      'X-CSRF-Token': 'tok-contact',
    })
    expect(JSON.parse(String(init?.body))).toEqual(filled)

    expect(screen.getByRole('status')).toHaveTextContent(/Thank you for your message/)
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Message')).toHaveValue('')
  })

  it("renders the server's message when the route answers 403", async () => {
    contactResponse = () => jsonResponse(csrfForbidden, 403)
    render(<ContactPage />)
    fillAndSubmit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Invalid or missing CSRF token')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    // The visitor's draft survives a failed submit.
    expect(screen.getByLabelText('Message')).toHaveValue(filled.message)
  })

  it('falls back to the generic message when the error body has none', async () => {
    contactResponse = () => new Response('', { status: 500 })
    render(<ContactPage />)
    fillAndSubmit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong. Please try again later.')
  })
})
