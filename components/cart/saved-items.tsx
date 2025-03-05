'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/lib/providers/CartProvider';
import { useSavedItems, SavedItem } from '@/hooks/useSavedItems';

export default function SavedItems() {
  const { savedItems, removeSavedItem, isLoading } = useSavedItems();
  const { addItemToCart } = useCart();
  const [movingToCart, setMovingToCart] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return <div className="h-12 animate-pulse rounded-md bg-muted"></div>;
  }

  if (savedItems.length === 0) {
    return null;
  }

  const handleMoveToCart = async (item: SavedItem) => {
    setMovingToCart(prev => ({ ...prev, [item.id]: true }));
    
    try {
      // Add to cart
      await addItemToCart({
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        quantity: 1,
      });
      
      // Remove from saved items
      removeSavedItem(item.id);
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => {
        setMovingToCart(prev => ({ ...prev, [item.id]: false }));
      }, 600);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Saved for Later ({savedItems.length})</h2>
      </div>
      
      <div className="space-y-3">
        {savedItems.map(item => (
          <div key={item.id} className="flex items-center space-x-4 rounded-lg border p-3">
            <div className="relative size-16 overflow-hidden rounded-md">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/products/${item.id}`} className="hover:underline">
                <h3 className="line-clamp-1 font-medium">{item.title}</h3>
              </Link>
              <p className="text-sm font-medium">{formatPrice(item.price)}</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMoveToCart(item)}
                disabled={movingToCart[item.id]}
                aria-label="Move to cart"
              >
                {movingToCart[item.id] ? (
                  <span className="flex items-center justify-center">
                    <svg className="mr-1 size-3 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Moving...
                  </span>
                ) : (
                  'Move to Cart'
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSavedItem(item.id)}
                aria-label="Remove saved item"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
