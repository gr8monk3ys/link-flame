'use client';

import Image from 'next/image';
import Link from 'next/link';
import { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ImperfectBadge, ImperfectSavingsBadge } from './ImperfectBadge';
import { ImperfectReasonBadge } from './ImperfectReasonTooltip';
import { useCart } from '@/lib/providers/CartProvider';
import { useSavedItems } from '@/hooks/useSavedItems';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';

interface ImperfectProduct {
  id: string;
  title: string;
  description?: string | null;
  image: string;
  category: string;
  inventory?: number;
  hasVariants?: boolean;
  // Price information
  originalPrice: number;
  salePrice?: number | null;
  imperfectPrice: number;
  discountPercent: number;
  totalSavings: number;
  // Imperfect details
  imperfectReason?: string | null;
  imperfectReasonLabel?: string | null;
  // Reviews
  averageRating?: number | null;
  reviewCount?: number;
}

interface ImperfectProductCardProps {
  product: ImperfectProduct;
  priority?: boolean;
  className?: string;
  showReason?: boolean;
  showSavings?: boolean;
}

/**
 * ImperfectProductCard - Product card specifically designed for imperfect items
 * Prominently displays savings and the reason for imperfection
 */
export const ImperfectProductCard = memo(function ImperfectProductCard({
  product,
  priority = false,
  className,
  showReason = true,
  showSavings = true,
}: ImperfectProductCardProps) {
  const { addItemToCart } = useCart();
  const { isItemSaved, toggleSaveItem } = useSavedItems();

  const isWishlisted = useMemo(() => isItemSaved(product.id), [isItemSaved, product.id]);

  const handleAddToCart = useCallback(async () => {
    try {
      await addItemToCart({
        id: product.id,
        title: product.title,
        price: product.imperfectPrice,
        image: product.image,
        quantity: 1,
      });
      toast.success('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart. Please try again.');
    }
  }, [addItemToCart, product]);

  const handleToggleWishlist = useCallback(() => {
    toggleSaveItem({
      id: product.id,
      title: product.title,
      price: product.imperfectPrice,
      image: product.image,
      quantity: 1,
    });
  }, [toggleSaveItem, product]);

  return (
    <div className={cn('group relative', className)}>
      {/* Imperfect badge - top left */}
      <div className="absolute left-4 top-4 z-10">
        <ImperfectBadge
          discountPercent={product.discountPercent}
          size="md"
          variant="prominent"
        />
      </div>

      {/* Wishlist button - top right */}
      <button
        className={cn(
          'absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow-md transition-all',
          isWishlisted
            ? 'opacity-100 text-red-500'
            : 'opacity-0 text-gray-900 group-hover:opacity-100'
        )}
        aria-label={
          isWishlisted
            ? `Remove ${product.title} from wishlist`
            : `Add ${product.title} to wishlist`
        }
        onClick={handleToggleWishlist}
      >
        <Heart className={cn('size-5', isWishlisted && 'fill-current')} />
      </button>

      {/* Add to cart button */}
      <button
        className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-md transition-opacity hover:bg-amber-500 group-hover:opacity-100"
        aria-label={`Add ${product.title} to cart`}
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>

      {/* Product image */}
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
        <Link href={`/products/${product.id}`}>
          <Image
            src={product.image}
            alt={product.title}
            width={400}
            height={400}
            className="size-full object-cover object-center transition-opacity group-hover:opacity-75"
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>
      </div>

      {/* Product info */}
      <div className="mt-4 space-y-2">
        {/* Title and category */}
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            <Link href={`/products/${product.id}`}>
              <span aria-hidden="true" className="absolute inset-0" />
              {product.title}
            </Link>
          </h3>
          <p className="text-sm text-gray-500">{product.category}</p>
        </div>

        {/* Price display - emphasize savings */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-amber-600">
            ${product.imperfectPrice.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500 line-through">
            ${product.originalPrice.toFixed(2)}
          </span>
        </div>

        {/* Savings badge */}
        {showSavings && (
          <ImperfectSavingsBadge
            originalPrice={product.originalPrice}
            imperfectPrice={product.imperfectPrice}
            size="sm"
          />
        )}

        {/* Reason badge */}
        {showReason && product.imperfectReason && (
          <ImperfectReasonBadge
            reason={product.imperfectReason}
            reasonLabel={product.imperfectReasonLabel || undefined}
          />
        )}

        {/* Rating */}
        {product.averageRating && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">
                {product.averageRating.toFixed(1)}
              </span>
              <span className="ml-1 text-yellow-400">&#9733;</span>
            </div>
            {product.reviewCount !== undefined && (
              <span className="text-sm text-gray-500">
                ({product.reviewCount} reviews)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

interface ImperfectProductGridProps {
  products: ImperfectProduct[];
  isLoading?: boolean;
  className?: string;
}

/**
 * ImperfectProductGrid - Grid layout for imperfect products
 */
export function ImperfectProductGrid({
  products,
  isLoading,
  className,
}: ImperfectProductGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          className
        )}
      >
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square w-full rounded-xl bg-gray-200" />
            <div className="mt-4 space-y-3">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-4 w-1/3 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-12 text-center">
        <div>
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <LeafIcon className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-medium text-amber-900">No imperfect items available</h3>
          <p className="mt-2 text-sm text-amber-700">
            Check back soon! We regularly add new imperfect items with great savings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {products.map((product, index) => (
        <ImperfectProductCard
          key={product.id}
          product={product}
          priority={index < 4}
        />
      ))}
    </div>
  );
}

// Icon component
function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
    </svg>
  );
}

export default ImperfectProductCard;
