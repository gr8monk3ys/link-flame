import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type { CartItem } from '@/types/cart';

export interface SavedItem extends CartItem {
  savedAt: string;
}

/**
 * Hook for managing saved items (wishlist) with database persistence.
 *
 * For authenticated users: Syncs with the database via API
 * For guests: Uses localStorage (items are migrated when user logs in)
 */
export function useSavedItems() {
  const { data: session, status } = useSession();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);
  const prevAuthStatus = useRef<string | null>(null);

  // Fetch saved items from the API
  const fetchSavedItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/saved-items');

      if (response.ok) {
        const payload = await response.json();
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        setSavedItems(items);
        // Also update localStorage as cache
        localStorage.setItem('savedItems', JSON.stringify(items));
      } else {
        console.error('Failed to fetch saved items');
        // Fallback to localStorage if API fails
        const localItems = localStorage.getItem('savedItems');
        if (localItems) {
          setSavedItems(JSON.parse(localItems));
        }
      }
    } catch (error) {
      console.error('Error fetching saved items:', error);
      // Fallback to localStorage on error
      try {
        const localItems = localStorage.getItem('savedItems');
        if (localItems) {
          setSavedItems(JSON.parse(localItems));
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize saved items on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      // First, load from localStorage for immediate display
      try {
        const localItems = localStorage.getItem('savedItems');
        if (localItems) {
          setSavedItems(JSON.parse(localItems));
        }
      } catch (error) {
        console.error('Error loading saved items from localStorage:', error);
      }

      // Then fetch from API (will update if different)
      if (status !== 'loading') {
        fetchSavedItems();
      }
    }
  }, [status, fetchSavedItems]);

  // Refetch when auth status changes (but not on migration, handled separately)
  useEffect(() => {
    if (hasInitialized.current && status !== 'loading' && prevAuthStatus.current !== null) {
      // Only refetch if we're not doing a migration (which has its own refetch)
      if (!(prevAuthStatus.current === 'unauthenticated' && status === 'authenticated')) {
        fetchSavedItems();
      }
    }
  }, [status, fetchSavedItems]);

  // Handle migration when user logs in
  useEffect(() => {
    const migrateSavedItems = async () => {
      // Check if user just logged in (transition from unauthenticated to authenticated)
      if (prevAuthStatus.current === 'unauthenticated' && status === 'authenticated' && session?.user?.id) {
        try {
          const response = await fetch('/api/saved-items/migrate', {
            method: 'POST',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.total > 0) {
              toast.success(`${data.migrated} saved item(s) synced to your account`);
            }
            // Refresh saved items to show migrated items
            await fetchSavedItems();
          } else {
            console.error('Failed to migrate saved items');
          }
        } catch (error) {
          console.error('[SAVED_ITEMS_MIGRATION_ERROR]', error);
        }
      }

      // Update the previous auth status
      prevAuthStatus.current = status;
    };

    if (status !== 'loading') {
      migrateSavedItems();
    }
  }, [status, session, fetchSavedItems]);

  // Save items to localStorage whenever they change (as cache)
  useEffect(() => {
    if (hasInitialized.current && !isLoading) {
      localStorage.setItem('savedItems', JSON.stringify(savedItems));
    }
  }, [savedItems, isLoading]);

  // Add item to saved items
  const saveItem = useCallback(async (item: CartItem) => {
    // Check if item already exists (optimistic check)
    if (savedItems.some(savedItem => savedItem.id === item.id)) {
      toast.info('Item already saved for later');
      return;
    }

    // Create optimistic saved item
    const optimisticItem: SavedItem = {
      ...item,
      savedAt: new Date().toISOString(),
    };

    // Optimistic update
    setSavedItems(prev => [...prev, optimisticItem]);

    try {
      const response = await fetch('/api/saved-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to save item');
      }

      const data = await response.json();

      if (data.data?.alreadySaved) {
        toast.info('Item already saved for later');
        // Remove optimistic update since it was already saved
        setSavedItems(prev => prev.filter(i => i.id !== item.id || i.savedAt !== optimisticItem.savedAt));
        await fetchSavedItems();
      } else {
        toast.success('Item saved for later');
        // Update with server response
        setSavedItems(prev =>
          prev.map(i =>
            i.id === item.id && i.savedAt === optimisticItem.savedAt
              ? { ...data.data }
              : i
          )
        );
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save item');
      // Revert optimistic update
      setSavedItems(prev => prev.filter(i => i.id !== item.id || i.savedAt !== optimisticItem.savedAt));
    }
  }, [savedItems, fetchSavedItems]);

  // Remove item from saved items
  const removeSavedItem = useCallback(async (itemId: string) => {
    // Store current state for rollback
    const previousItems = savedItems;

    // Optimistic update
    setSavedItems(prev => prev.filter(item => item.id !== itemId));

    try {
      const response = await fetch(`/api/saved-items?productId=${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      toast.success('Item removed from saved items');
    } catch (error) {
      console.error('Error removing saved item:', error);
      toast.error('Failed to remove item');
      // Revert optimistic update
      setSavedItems(previousItems);
    }
  }, [savedItems]);

  // Check if an item is saved
  const isItemSaved = useCallback((itemId: string) => {
    return savedItems.some(item => item.id === itemId);
  }, [savedItems]);

  // Toggle saved status
  const toggleSaveItem = useCallback(async (item: CartItem) => {
    if (isItemSaved(item.id)) {
      await removeSavedItem(item.id);
    } else {
      await saveItem(item);
    }
  }, [isItemSaved, removeSavedItem, saveItem]);

  return {
    savedItems,
    isLoading,
    saveItem,
    removeSavedItem,
    isItemSaved,
    toggleSaveItem,
    refreshSavedItems: fetchSavedItems,
  };
}
