import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type { Wishlist, WishlistItem } from '@/components/wishlists';

/**
 * Hook for managing wishlists with database persistence.
 *
 * For authenticated users: Syncs with the database via API
 * For guests: Uses the same API (guest session handled server-side)
 */
export function useWishlists() {
  const { status } = useSession();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  // Fetch wishlists from the API
  const fetchWishlists = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/wishlists');

      if (response.ok) {
        const result = await response.json();
        setWishlists(result.data || []);
      } else {
        console.error('Failed to fetch wishlists');
      }
    } catch (error) {
      console.error('Error fetching wishlists:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCsrfToken = useCallback(async (): Promise<string> => {
    const response = await fetch('/api/csrf');
    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }

    const data = await response.json().catch(() => ({}));
    const token = typeof data?.token === 'string' ? data.token : null;
    if (!token) {
      throw new Error('Failed to get CSRF token');
    }

    return token;
  }, []);

  // Initialize wishlists on mount
  useEffect(() => {
    if (!hasInitialized.current && status !== 'loading') {
      hasInitialized.current = true;
      fetchWishlists();
    }
  }, [status, fetchWishlists]);

  // Create a new wishlist
  const createWishlist = useCallback(async (name: string, isPublic = false) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch('/api/wishlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ name, isPublic }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to create wishlist');
      }

      const result = await response.json();
      setWishlists((prev) => [...prev, result.data]);
      toast.success('Wishlist created');
      return result.data;
    } catch (error) {
      console.error('Error creating wishlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create wishlist');
      throw error;
    }
  }, [getCsrfToken]);

  // Rename a wishlist
  const renameWishlist = useCallback(async (id: string, name: string) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`/api/wishlists/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to rename wishlist');
      }

      const result = await response.json();
      setWishlists((prev) =>
        prev.map((w) => (w.id === id ? result.data : w))
      );
      toast.success('Wishlist renamed');
    } catch (error) {
      console.error('Error renaming wishlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to rename wishlist');
      throw error;
    }
  }, [getCsrfToken]);

  // Toggle wishlist public/private
  const toggleWishlistPublic = useCallback(async (id: string, isPublic: boolean) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`/api/wishlists/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ isPublic }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to update wishlist');
      }

      const result = await response.json();
      setWishlists((prev) =>
        prev.map((w) => (w.id === id ? result.data : w))
      );
      toast.success(isPublic ? 'Wishlist is now public' : 'Wishlist is now private');
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update wishlist');
      throw error;
    }
  }, [getCsrfToken]);

  // Delete a wishlist
  const deleteWishlist = useCallback(async (id: string) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`/api/wishlists/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to delete wishlist');
      }

      setWishlists((prev) => prev.filter((w) => w.id !== id));
      toast.success('Wishlist deleted');
    } catch (error) {
      console.error('Error deleting wishlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete wishlist');
      throw error;
    }
  }, [getCsrfToken]);

  // Add item to wishlist
  const addToWishlist = useCallback(async (wishlistId: string, productId: string, note?: string) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`/api/wishlists/${wishlistId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ productId, note }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to add item');
      }

      const result = await response.json();

      if (result.data?.alreadySaved) {
        toast.info('Item already in wishlist');
        return;
      }

      // Update local state
      setWishlists((prev) =>
        prev.map((w) => {
          if (w.id === wishlistId) {
            return {
              ...w,
              itemCount: w.itemCount + 1,
              items: [result.data, ...w.items],
            };
          }
          return w;
        })
      );
      toast.success('Item added to wishlist');
    } catch (error) {
      console.error('Error adding item to wishlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add item');
      throw error;
    }
  }, [getCsrfToken]);

  // Remove item from wishlist
  const removeFromWishlist = useCallback(async (wishlistId: string, productId: string) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(
        `/api/wishlists/${wishlistId}/items?productId=${productId}`,
        {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to remove item');
      }

      // Update local state
      setWishlists((prev) =>
        prev.map((w) => {
          if (w.id === wishlistId) {
            return {
              ...w,
              itemCount: w.itemCount - 1,
              items: w.items.filter((item) => item.productId !== productId),
            };
          }
          return w;
        })
      );
      toast.success('Item removed');
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove item');
      throw error;
    }
  }, [getCsrfToken]);

  // Move item between wishlists
  const moveToWishlist = useCallback(
    async (fromWishlistId: string, toWishlistId: string, productId: string) => {
      try {
        const csrfToken = await getCsrfToken();
        const response = await fetch(`/api/wishlists/${fromWishlistId}/move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({ productId, toWishlistId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to move item');
        }

        const result = await response.json();

        // Update local state
        setWishlists((prev) => {
          return prev.map((w) => {
            if (w.id === fromWishlistId) {
              return {
                ...w,
                itemCount: w.itemCount - 1,
                items: w.items.filter((item) => item.productId !== productId),
              };
            }
            if (w.id === toWishlistId && result.data?.item) {
              return {
                ...w,
                itemCount: w.itemCount + 1,
                items: [result.data.item, ...w.items],
              };
            }
            return w;
          });
        });

        toast.success('Item moved');
      } catch (error) {
        console.error('Error moving item:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to move item');
        throw error;
      }
    },
    [getCsrfToken]
  );

  // Update note for a saved item
  const updateWishlistItemNote = useCallback(async (itemId: string, note: string | null) => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`/api/wishlists/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to update note');
      }

      const result = await response.json();
      const updatedNote = result.data?.note ?? null;

      setWishlists((prev) =>
        prev.map((w) => ({
          ...w,
          items: w.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  note: updatedNote,
                }
              : item
          ),
        }))
      );

      toast.success(updatedNote ? 'Note updated' : 'Note removed');
    } catch (error) {
      console.error('Error updating item note:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update note');
      throw error;
    }
  }, [getCsrfToken]);

  // Get default wishlist
  const getDefaultWishlist = useCallback(() => {
    return wishlists.find((w) => w.isDefault);
  }, [wishlists]);

  // Check if product is in any wishlist
  const isProductSaved = useCallback(
    (productId: string) => {
      return wishlists.some((w) =>
        w.items.some((item) => item.productId === productId)
      );
    },
    [wishlists]
  );

  // Get all saved items across all wishlists
  const getAllSavedItems = useCallback(() => {
    return wishlists.flatMap((w) =>
      w.items.map((item) => ({
        ...item,
        wishlistId: w.id,
        wishlistName: w.name,
      }))
    );
  }, [wishlists]);

  return {
    wishlists,
    isLoading,
    createWishlist,
    renameWishlist,
    toggleWishlistPublic,
    deleteWishlist,
    addToWishlist,
    removeFromWishlist,
    moveToWishlist,
    updateWishlistItemNote,
    getDefaultWishlist,
    isProductSaved,
    getAllSavedItems,
    refreshWishlists: fetchWishlists,
  };
}
