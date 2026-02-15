'use client';

import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WishlistManager } from '@/components/wishlists/WishlistManager';
import { useWishlists } from '@/hooks/useWishlists';
import { useCart } from '@/lib/providers/CartProvider';
import { toast } from 'sonner';
import type { WishlistItem } from '@/components/wishlists';

function SavedItemsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedWishlistId = searchParams.get('wishlist') || undefined;

  const {
    wishlists,
    isLoading,
    createWishlist,
    renameWishlist,
    toggleWishlistPublic,
    deleteWishlist,
    removeFromWishlist,
    moveToWishlist,
    updateWishlistItemNote,
  } = useWishlists();

  const { addItemToCart } = useCart();

  const isAuthLoaded = status !== 'loading';
  const isSignedIn = !!session;

  if (!isAuthLoaded) {
    return (
      <div className="container flex items-center justify-center py-10">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your wishlists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelectWishlist = (id: string | null) => {
    if (id) {
      router.push(`/account/saved?wishlist=${id}`);
    } else {
      router.push('/account/saved');
    }
  };

  const handleCreateWishlist = async (name: string, isPublic: boolean) => {
    await createWishlist(name, isPublic);
  };

  const handleRenameWishlist = async (id: string, newName: string) => {
    await renameWishlist(id, newName);
  };

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    await toggleWishlistPublic(id, isPublic);
  };

  const handleDeleteWishlist = async (id: string) => {
    await deleteWishlist(id);
    // If we were viewing the deleted wishlist, go back to the list
    if (selectedWishlistId === id) {
      router.push('/account/saved');
    }
  };

  const handleRemoveItem = async (wishlistId: string, productId: string) => {
    await removeFromWishlist(wishlistId, productId);
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    await addItemToCart({
      id: item.productId,
      title: item.product.title,
      price: item.product.salePrice || item.product.price,
      image: item.product.image,
      quantity: 1,
    });
    toast.success('Added to cart');
  };

  const handleMoveItem = async (
    fromWishlistId: string,
    toWishlistId: string,
    productId: string
  ) => {
    await moveToWishlist(fromWishlistId, toWishlistId, productId);
  };

  const handleUpdateNote = async (itemId: string, note: string | null) => {
    await updateWishlistItemNote(itemId, note);
  };

  const handleShareLink = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/wishlists/shared/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  return (
    <div className="container max-w-6xl py-10">
      <WishlistManager
        wishlists={wishlists}
        selectedWishlistId={selectedWishlistId}
        onSelectWishlist={handleSelectWishlist}
        onCreateWishlist={handleCreateWishlist}
        onRenameWishlist={handleRenameWishlist}
        onTogglePublic={handleTogglePublic}
        onDeleteWishlist={handleDeleteWishlist}
        onRemoveItem={handleRemoveItem}
        onMoveToCart={handleMoveToCart}
        onMoveItem={handleMoveItem}
        onUpdateNote={handleUpdateNote}
        onShareLink={handleShareLink}
        isLoading={isLoading}
      />
    </div>
  );
}

function SavedItemsLoading() {
  return (
    <div className="container flex items-center justify-center py-10">
      <Loader2 className="size-8 animate-spin" />
    </div>
  );
}

export default function SavedItemsPage() {
  return (
    <Suspense fallback={<SavedItemsLoading />}>
      <SavedItemsContent />
    </Suspense>
  );
}
