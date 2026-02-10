import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { getPublicWishlist } from '@/lib/wishlists';

interface SharedWishlistPageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedWishlistPage({ params }: SharedWishlistPageProps) {
  const { token } = await params;

  const wishlist = await getPublicWishlist(token);

  if (!wishlist) {
    notFound();
  }

  return (
    <div className="container max-w-4xl py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Heart className="size-6 fill-red-500 text-red-500" />
          <h1 className="text-3xl font-bold">{wishlist.name}</h1>
        </div>
        <p className="text-muted-foreground">
          {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Items Grid */}
      {wishlist.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Heart className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">This wishlist is empty</h3>
          <p className="text-muted-foreground">
            No items have been added to this wishlist yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.items.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-lg border bg-card"
            >
              {/* Product Image */}
              <Link
                href={`/products/${item.productId}`}
                className="relative block aspect-square overflow-hidden bg-muted"
              >
                <Image
                  src={item.product.image}
                  alt={item.product.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </Link>

              {/* Product Info */}
              <div className="p-4">
                <Link
                  href={`/products/${item.productId}`}
                  className="line-clamp-2 font-medium hover:underline"
                >
                  {item.product.title}
                </Link>

                <div className="mt-2 flex items-center gap-2">
                  {item.product.salePrice ? (
                    <>
                      <span className="font-semibold text-red-600">
                        {formatPrice(Number(item.product.salePrice))}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(Number(item.product.price))}
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold">
                      {formatPrice(Number(item.product.price))}
                    </span>
                  )}
                </div>

                {item.note && (
                  <p className="mt-2 line-clamp-2 text-sm italic text-muted-foreground">
                    &quot;{item.note}&quot;
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <Link href={`/products/${item.productId}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <ExternalLink className="mr-2 size-4" />
                      View Product
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="mb-4 text-muted-foreground">
          Want to create your own wishlist?
        </p>
        <Link href="/auth/signin">
          <Button>
            <Heart className="mr-2 size-4" />
            Sign Up
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: SharedWishlistPageProps) {
  const { token } = await params;
  const wishlist = await getPublicWishlist(token);

  if (!wishlist) {
    return {
      title: 'Wishlist Not Found',
    };
  }

  return {
    title: `${wishlist.name} - Shared Wishlist`,
    description: `Check out this wishlist with ${wishlist.items.length} items`,
  };
}
