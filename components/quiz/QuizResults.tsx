'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useCart } from '@/lib/providers/CartProvider';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Share2, Leaf, ShoppingCart, Sparkles, RefreshCw } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  image: string;
  category: string;
  inventory: number;
}

interface QuizResultsProps {
  visibleId: string;
  products: Product[];
  onRetakeQuiz?: () => void;
  showShareButton?: boolean;
}

export function QuizResults({
  visibleId,
  products,
  onRetakeQuiz,
  showShareButton = true,
}: QuizResultsProps) {
  const { data: session } = useSession();
  const { addItemToCart } = useCart();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [animatedCards, setAnimatedCards] = useState<Set<number>>(new Set());
  const animationTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Animate cards on mount with proper cleanup
  useEffect(() => {
    // Clear any existing timeouts
    animationTimeoutsRef.current.forEach(clearTimeout);
    animationTimeoutsRef.current = [];

    // Reset animated cards when products change
    setAnimatedCards(new Set());

    products.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setAnimatedCards((prev) => new Set([...prev, index]));
      }, index * 100);
      animationTimeoutsRef.current.push(timeout);
    });

    // Cleanup function to clear all timeouts on unmount or when products change
    return () => {
      animationTimeoutsRef.current.forEach(clearTimeout);
      animationTimeoutsRef.current = [];
    };
  }, [products]);

  // Memoize copyToClipboard first since it's used by handleShare
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  }, []);

  // Memoize handleAddToCart to prevent unnecessary re-renders
  const handleAddToCart = useCallback(async (product: Product) => {
    if (!session?.user) {
      toast.error('Please sign in to add items to your cart');
      return;
    }

    if (product.inventory <= 0) {
      toast.error('This product is out of stock');
      return;
    }

    setLoadingIds((prev) => new Set([...prev, product.id]));

    try {
      await addItemToCart({
        id: product.id,
        title: product.title,
        price: product.salePrice || product.price,
        image: product.image,
        quantity: 1,
      });
      toast.success(`${product.title} added to cart`);
    } catch {
      toast.error('Failed to add item to cart');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  }, [session?.user, addItemToCart]);

  // Memoize handleShare to prevent unnecessary re-renders
  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/quiz/results/${visibleId}`;
    const shareText = 'Check out my personalized eco-friendly product recommendations from Link Flame!';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Eco-Friendly Product Recommendations',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
        await copyToClipboard(shareUrl);
      }
    } else {
      await copyToClipboard(shareUrl);
    }
  }, [visibleId, copyToClipboard]);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Leaf className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No recommendations yet</h3>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t find products matching your preferences. Try adjusting your answers!
        </p>
        {onRetakeQuiz && (
          <Button onClick={onRetakeQuiz} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Quiz
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold">
          Your Personalized Recommendations
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Based on your answers, we&apos;ve selected {products.length} eco-friendly products
          that match your lifestyle and values.
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {showShareButton && (
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </Button>
          )}
          {onRetakeQuiz && (
            <Button variant="ghost" size="sm" onClick={onRetakeQuiz}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => {
          const isLoading = loadingIds.has(product.id);
          const isOutOfStock = product.inventory <= 0;
          const isOnSale = product.salePrice && product.salePrice < product.price;
          const isAnimated = animatedCards.has(index);

          return (
            <Card
              key={product.id}
              className={cn(
                'group overflow-hidden transition-all duration-500',
                'hover:shadow-lg hover:-translate-y-1',
                isAnimated
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              )}
            >
              <CardHeader className="p-0 relative">
                <Link href={`/products/${product.id}`}>
                  <AspectRatio ratio={1}>
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </AspectRatio>
                </Link>
                {isOnSale && (
                  <Badge className="absolute top-2 left-2" variant="destructive">
                    Sale
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge
                    className="absolute top-2 right-2"
                    variant="secondary"
                  >
                    Out of Stock
                  </Badge>
                )}
                <Badge
                  className="absolute bottom-2 left-2"
                  variant="outline"
                >
                  {product.category}
                </Badge>
              </CardHeader>

              <CardContent className="p-4">
                <Link
                  href={`/products/${product.id}`}
                  className="block hover:text-primary transition-colors"
                >
                  <h3 className="font-semibold line-clamp-2 mb-1">
                    {product.title}
                  </h3>
                </Link>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-lg font-bold">
                    ${(product.salePrice || product.price).toFixed(2)}
                  </span>
                  {isOnSale && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(product)}
                  disabled={isLoading || isOutOfStock || !session?.user}
                  variant={isOutOfStock ? 'secondary' : 'default'}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Adding...
                    </span>
                  ) : isOutOfStock ? (
                    'Out of Stock'
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Browse more */}
      <div className="text-center pt-4">
        <p className="text-muted-foreground mb-4">
          Want to explore more sustainable products?
        </p>
        <Button asChild variant="outline" size="lg">
          <Link href="/products">Browse All Products</Link>
        </Button>
      </div>
    </div>
  );
}
