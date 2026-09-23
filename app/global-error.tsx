'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Loaded on demand so the SDK stays out of the root layout's client graph;
    // instrumentation-client.ts defers it the same way.
    void import('@/lib/sentry-browser').then(({ captureException }) => captureException(error))
  }, [error])

  return (
    <html>
      <body style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#2c2521', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, backgroundColor: '#fcfaf8' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#766960', marginBottom: '1.5rem' }}>We&rsquo;ve been notified and are looking into it.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#2a6f4f', color: '#fcfaf8', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{ padding: '0.5rem 1rem', backgroundColor: '#f3eee8', color: '#2c2521', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem' }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
