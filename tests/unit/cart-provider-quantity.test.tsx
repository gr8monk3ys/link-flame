import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'unauthenticated', data: null }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

import { CartProvider, useCart } from '@/lib/providers/CartProvider'

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>

describe('CartProvider quantity updates', () => {
  let patches: Array<Record<string, unknown>>

  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    })
    patches = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === '/api/csrf') {
          return new Response(JSON.stringify({ token: 'csrf' }), { status: 200 })
        }
        if (url === '/api/cart' && init?.method === 'PATCH') {
          patches.push(JSON.parse(String(init.body)))
          return new Response(JSON.stringify({ success: true }), { status: 200 })
        }
        return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves every item changed within one debounce window, then stops loading', async () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.updateQuantity('prod-a', 3)
      result.current.updateQuantity('prod-b', 2, 'var-1')
      result.current.updateQuantity('prod-b', 4, 'var-1')
    })
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 })
    expect(patches).toHaveLength(2)
    expect(patches).toEqual(
      expect.arrayContaining([
        { productId: 'prod-a', variantId: null, quantity: 3 },
        { productId: 'prod-b', variantId: 'var-1', quantity: 4 },
      ])
    )
  })
})
