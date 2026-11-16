import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const search = vi.hoisted(() => ({ value: '' }))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(search.value),
}))

import { UnsubscribeConfirm } from '@/components/newsletter/unsubscribe-confirm'

type Call = [string, RequestInit | undefined]

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('UnsubscribeConfirm', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let unsubscribeResponse: () => Response

  beforeEach(() => {
    search.value = 'id=sub-1&t=tok-abc'
    unsubscribeResponse = () =>
      jsonResponse({
        success: true,
        data: { unsubscribed: true, alreadyRemoved: false },
        meta: { timestamp: '2026-11-09T00:00:00.000Z', message: 'You are unsubscribed.' },
      })
    fetchMock = vi.fn(async (url: string) => {
      if (url === '/api/csrf') {
        return jsonResponse({ token: 'tok-csrf', message: 'CSRF token generated successfully' })
      }
      if (url === '/api/newsletter/unsubscribe') {
        return unsubscribeResponse()
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('removes nothing when the page only opens', () => {
    // Mail scanners open every link in an email. Opening must not unsubscribe.
    render(<UnsubscribeConfirm />)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Unsubscribe' })).toBeTruthy()
  })

  it('posts the id and token when the button is pressed', async () => {
    render(<UnsubscribeConfirm />)
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))

    const status = await waitFor(() => screen.getByRole('status'))
    expect(status.textContent).toContain('You are unsubscribed')

    const calls = fetchMock.mock.calls as Call[]
    const post = calls.find(([url]) => url === '/api/newsletter/unsubscribe')
    expect(post?.[1]?.method).toBe('POST')
    expect(new Headers(post?.[1]?.headers).get('X-CSRF-Token')).toBe('tok-csrf')
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ id: 'sub-1', token: 'tok-abc' })
  })

  it('shows the server message when the link is not valid', async () => {
    unsubscribeResponse = () =>
      jsonResponse(
        {
          success: false,
          error: {
            message: 'This unsubscribe link is not valid. Use the link from your most recent email.',
            code: 'BAD_REQUEST',
          },
          meta: { timestamp: '2026-11-09T00:00:00.000Z' },
        },
        400
      )
    render(<UnsubscribeConfirm />)
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))

    const alert = await waitFor(() => screen.getByRole('alert'))
    expect(alert.textContent).toContain('not valid')
  })

  it('shows no button when the link is incomplete', () => {
    search.value = 'id=sub-1'
    render(<UnsubscribeConfirm />)
    expect(screen.queryByRole('button', { name: 'Unsubscribe' })).toBeNull()
    expect(screen.getByText('Link not complete')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
