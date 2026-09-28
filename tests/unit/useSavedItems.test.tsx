import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

const sessionState: { status: Status; data: { user: { id: string } } | null } = {
  status: 'loading',
  data: null,
};

vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: sessionState.status, data: sessionState.data }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { useSavedItems } from '@/hooks/useSavedItems';

const serverItem = {
  id: 'prod-1',
  title: 'Bamboo toothbrush',
  price: 5,
  image: '/x.jpg',
  quantity: 1,
  savedAt: '2026-01-01T00:00:00.000Z',
};

describe('useSavedItems', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // An in-memory Storage: Node 25+ ships its own global localStorage that
    // shadows happy-dom's and is undefined without --localstorage-file.
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    });
    sessionState.status = 'loading';
    sessionState.data = null;
    fetchMock = vi.fn(async (url: string) => {
      if (url === '/api/saved-items') {
        return new Response(JSON.stringify({ success: true, data: [serverItem] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('{}', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads saved items from the API once a signed-in session resolves', async () => {
    const { result, rerender } = renderHook(() => useSavedItems());
    expect(fetchMock).not.toHaveBeenCalled();

    sessionState.status = 'authenticated';
    sessionState.data = { user: { id: 'user-1' } };
    rerender();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchMock).toHaveBeenCalledWith('/api/saved-items');
    expect(result.current.savedItems).toEqual([serverItem]);
  });

  it('loads saved items for a guest once the session resolves as signed out', async () => {
    const { result, rerender } = renderHook(() => useSavedItems());

    sessionState.status = 'unauthenticated';
    rerender();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.isItemSaved('prod-1')).toBe(true);
  });

  it('fetches only once when the session is already resolved on mount', async () => {
    sessionState.status = 'unauthenticated';
    const { result } = renderHook(() => useSavedItems());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
