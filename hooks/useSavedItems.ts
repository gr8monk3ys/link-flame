import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { CartItem } from '@/types/cart';

export interface SavedItem extends CartItem {
  savedAt: string;
}

export function useSavedItems() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved items from localStorage on mount
  useEffect(() => {
    const loadSavedItems = () => {
      try {
        const savedItemsJson = localStorage.getItem('savedItems');
        if (savedItemsJson) {
          setSavedItems(JSON.parse(savedItemsJson));
        }
      } catch (error) {
        console.error('Error loading saved items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedItems();
  }, []);

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('savedItems', JSON.stringify(savedItems));
    }
  }, [savedItems, isLoading]);

  // Add item to saved items
  const saveItem = useCallback((item: CartItem) => {
    setSavedItems(prev => {
      // Check if item already exists
      if (prev.some(savedItem => savedItem.id === item.id)) {
        toast.info('Item already saved for later');
        return prev;
      }
      
      // Add item with timestamp
      const savedItem: SavedItem = {
        ...item,
        savedAt: new Date().toISOString(),
      };
      
      toast.success('Item saved for later');
      return [...prev, savedItem];
    });
  }, []);

  // Remove item from saved items
  const removeSavedItem = useCallback((itemId: string) => {
    setSavedItems(prev => {
      const newItems = prev.filter(item => item.id !== itemId);
      if (newItems.length !== prev.length) {
        toast.success('Item removed from saved items');
      }
      return newItems;
    });
  }, []);

  // Check if an item is saved
  const isItemSaved = useCallback((itemId: string) => {
    return savedItems.some(item => item.id === itemId);
  }, [savedItems]);

  return {
    savedItems,
    isLoading,
    saveItem,
    removeSavedItem,
    isItemSaved,
  };
}
