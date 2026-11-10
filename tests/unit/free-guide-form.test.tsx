import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FreeGuideForm } from '@/components/free-guide/free-guide-form'
import { FREE_GUIDE } from '@/config/free-guide'

type Call = [string, RequestInit | undefined]

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('FreeGuideForm', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let newsletterResponse: () => Response

  beforeEach(() => {
    newsletterResponse = () =>
      jsonResponse(
        {
          success: true,
          data: { email: 'a@b.co', subscriptionId: 'sub-1' },
          meta: { timestamp: '2026-11-09T00:00:00.000Z', message: 'Successfully subscribed to newsletter' },
        },
        201
      )
    fetchMock = vi.fn(async (url: string) => {
      if (url === '/api/csrf') {
        return jsonResponse({ token: 'tok-guide', message: 'CSRF token generated successfully' })
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
    fireEvent.change(screen.getByLabelText('Your email address'), { target: { value: email } })
    const form = screen.getByRole('button', { name: 'Send me the guide' }).closest('form')
    if (!form) throw new Error('free guide form not rendered')
    fireEvent.submit(form)
  }

  it('makes no request on mount and says the signup joins the email list', () => {
    render(<FreeGuideForm />)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText(/adds you to the Link Flame email list/)).toBeTruthy()
  })

  it('posts the address with a CSRF token and then shows the download link', async () => {
    render(<FreeGuideForm />)
    submit()

    const link = await waitFor(() => screen.getByRole('link', { name: 'Download the PDF' }))
    expect(link.getAttribute('href')).toBe(FREE_GUIDE.href)
    expect(link.getAttribute('download')).toBe(FREE_GUIDE.fileName)

    const calls = fetchMock.mock.calls as Call[]
    const post = calls.find(([url]) => url === '/api/newsletter')
    expect(post).toBeDefined()
    expect(post?.[1]?.method).toBe('POST')
    expect(new Headers(post?.[1]?.headers).get('X-CSRF-Token')).toBe('tok-guide')
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ email: 'a@b.co' })
  })

  it('gives the guide to an address that is already on the list', async () => {
    newsletterResponse = () =>
      jsonResponse({
        success: true,
        data: { email: 'a@b.co', alreadySubscribed: true },
        meta: { timestamp: '2026-11-09T00:00:00.000Z', message: 'Email already subscribed' },
      })
    render(<FreeGuideForm />)
    submit()

    await waitFor(() => screen.getByRole('link', { name: 'Download the PDF' }))
  })

  it('shows the server message and keeps the form when the signup fails', async () => {
    newsletterResponse = () =>
      jsonResponse(
        {
          success: false,
          error: { message: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
          meta: { timestamp: '2026-11-09T00:00:00.000Z' },
        },
        429
      )
    render(<FreeGuideForm />)
    submit()

    const alert = await waitFor(() => screen.getByRole('alert'))
    expect(alert.textContent).toContain('Too many requests')
    expect(screen.queryByRole('link', { name: 'Download the PDF' })).toBeNull()
    expect(screen.getByLabelText('Your email address').getAttribute('aria-invalid')).toBe('true')
  })
})
