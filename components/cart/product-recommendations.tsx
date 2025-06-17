'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/lib/providers/CartProvider';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LoadingShimmer } from '@/components/ui/loading-shimmer';
import type { Product } from '@/types/product';

export default function ProductRecommendations() {
  const { cart, addItemToCart, isProductInCart } = useCart();
  const [categories, setCategories] = useState<string[]>([]);
  const { products, isLoading } = useProducts({ 
    featured: true,
    limit: 4
  });
  const [isAdding, setIsAdding] = useState<Record<string, boolean>>({});

  // Extract categories from cart items to find related products
  useEffect(() => {
    if (cart.items.length > 0) {
      // This would be better if we had access to product categories from cart items
      // For now, we're just using featured products
      setCategories(['featured']);
    }
  }, [cart.items]);

  const handleAddToCart = async (product: Product) => {
    setIsAdding(prev => ({ ...prev, [product.id]: true }));

    try {
      await addItemToCart({
        id: product.id,
        title: product.title,
        price: product.salePrice || product.price,
        image: product.image,
        quantity: 1,
      });
    } finally {
      // Reset loading state after a short delay for better UX
      setTimeout(() => {
        setIsAdding(prev => ({ ...prev, [product.id]: false }));
      }, 600);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-medium">You might also like</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingShimmer key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium">You might also like</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="group rounded-lg border p-3 transition-all hover:shadow-md">
            <Link href={`/products/${product.id}`} className="block">
              <div className="relative mb-3 aspect-square overflow-hidden rounded-md">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <h3 className="line-clamp-2 text-sm font-medium">{product.title}</h3>
              <p className="mt-1 text-sm font-bold">{formatPrice(product.salePrice || product.price)}</p>
            </Link>
            <div className="mt-2">
              {isProductInCart(product.id) ? (
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Added to cart
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleAddToCart(product)}
                  disabled={isAdding[product.id]}
                >
                  {isAdding[product.id] ? (
                    <span className="flex items-center justify-center">
                      <svg className="mr-2 size-4 animate-spin" viewBox="0 0 24 24">
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
                      Adding...
                    </span>
                  ) : (
                    'Add to cart'
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
