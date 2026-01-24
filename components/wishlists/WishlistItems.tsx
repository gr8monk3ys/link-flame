'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, ShoppingCart, MoveRight, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface WishlistItem {
  id: string;
  productId: string;
  note: string | null;
  addedAt: string;
  product: {
    id: string;
    title: string;
    price: number;
    salePrice: number | null;
    image: string;
    category?: string;
  };
}

interface WishlistOption {
  id: string;
  name: string;
}

interface WishlistItemsProps {
  items: WishlistItem[];
  wishlists?: WishlistOption[];
  currentWishlistId: string;
  onRemove: (productId: string) => Promise<void>;
  onMoveToCart: (item: WishlistItem) => Promise<void>;
  onMoveTo?: (productId: string, toWishlistId: string) => Promise<void>;
  onUpdateNote?: (itemId: string, note: string | null) => Promise<void>;
  isLoading?: boolean;
}

export function WishlistItems({
  items,
  wishlists = [],
  currentWishlistId,
  onRemove,
  onMoveToCart,
  onMoveTo,
  onUpdateNote,
  isLoading = false,
}: WishlistItemsProps) {
  const [movingToCart, setMovingToCart] = useState<Record<string, boolean>>({});
  const [removing, setRemoving] = useState<Record<string, boolean>>({});
  const [moveDialogItem, setMoveDialogItem] = useState<WishlistItem | null>(null);
  const [noteDialogItem, setNoteDialogItem] = useState<WishlistItem | null>(null);
  const [noteText, setNoteText] = useState('');

  // Memoize filtered wishlists to prevent recalculation on every render
  const otherWishlists = useMemo(
    () => wishlists.filter((w) => w.id !== currentWishlistId),
    [wishlists, currentWishlistId]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No items yet</h3>
        <p className="mb-4 text-muted-foreground">
          Start adding products to this wishlist
        </p>
        <Link href="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  // Memoize event handlers to prevent unnecessary re-renders
  const handleMoveToCart = useCallback(async (item: WishlistItem) => {
    setMovingToCart((prev) => ({ ...prev, [item.productId]: true }));
    try {
      await onMoveToCart(item);
    } finally {
      setMovingToCart((prev) => ({ ...prev, [item.productId]: false }));
    }
  }, [onMoveToCart]);

  const handleRemove = useCallback(async (productId: string) => {
    setRemoving((prev) => ({ ...prev, [productId]: true }));
    try {
      await onRemove(productId);
    } finally {
      setRemoving((prev) => ({ ...prev, [productId]: false }));
    }
  }, [onRemove]);

  const handleMoveTo = useCallback(async (toWishlistId: string) => {
    if (!moveDialogItem || !onMoveTo) return;
    await onMoveTo(moveDialogItem.productId, toWishlistId);
    setMoveDialogItem(null);
  }, [moveDialogItem, onMoveTo]);

  const handleSaveNote = useCallback(async () => {
    if (!noteDialogItem || !onUpdateNote) return;
    await onUpdateNote(noteDialogItem.id, noteText || null);
    setNoteDialogItem(null);
  }, [noteDialogItem, onUpdateNote, noteText]);

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-lg border bg-card p-4"
          >
            {/* Product Image */}
            <Link
              href={`/products/${item.productId}`}
              className="relative size-24 shrink-0 overflow-hidden rounded-md"
            >
              <Image
                src={item.product.image}
                alt={item.product.title}
                fill
                className="object-cover transition-transform hover:scale-105"
                sizes="96px"
              />
            </Link>

            {/* Product Details */}
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.productId}`}
                className="line-clamp-2 font-medium hover:underline"
              >
                {item.product.title}
              </Link>

              <div className="mt-1 flex items-center gap-2">
                {item.product.salePrice ? (
                  <>
                    <span className="font-semibold text-red-600">
                      {formatPrice(item.product.salePrice)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(item.product.price)}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold">
                    {formatPrice(item.product.price)}
                  </span>
                )}
              </div>

              {item.note && (
                <p className="mt-2 text-sm italic text-muted-foreground">
                  "{item.note}"
                </p>
              )}

              <p className="mt-1 text-xs text-muted-foreground">
                Added {new Date(item.addedAt).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => handleMoveToCart(item)}
                disabled={movingToCart[item.productId]}
              >
                {movingToCart[item.productId] ? (
                  <span className="flex items-center gap-1">
                    <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Adding...
                  </span>
                ) : (
                  <>
                    <ShoppingCart className="mr-1 size-4" />
                    Add to Cart
                  </>
                )}
              </Button>

              <div className="flex gap-1">
                {onUpdateNote && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => {
                      setNoteText(item.note || '');
                      setNoteDialogItem(item);
                    }}
                    title="Add note"
                  >
                    <MessageSquare className="size-4" />
                  </Button>
                )}

                {onMoveTo && otherWishlists.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setMoveDialogItem(item)}
                    title="Move to another list"
                  >
                    <MoveRight className="size-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(item.productId)}
                  disabled={removing[item.productId]}
                  title="Remove"
                >
                  {removing[item.productId] ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Move to Wishlist Dialog */}
      <Dialog open={!!moveDialogItem} onOpenChange={(open) => !open && setMoveDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Wishlist</DialogTitle>
            <DialogDescription>
              Select a wishlist to move "{moveDialogItem?.product.title}" to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {otherWishlists.map((wishlist) => (
              <button
                key={wishlist.id}
                className="flex w-full items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                onClick={() => handleMoveTo(wishlist.id)}
              >
                <span className="font-medium">{wishlist.name}</span>
                <MoveRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Note Dialog */}
      <Dialog open={!!noteDialogItem} onOpenChange={(open) => !open && setNoteDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a personal note for "{noteDialogItem?.product.title}"
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g., Gift for mom's birthday"
            className="min-h-[100px] w-full resize-none rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={500}
          />
          <DialogFooter>
            {noteDialogItem?.note && (
              <Button
                variant="ghost"
                onClick={() => {
                  setNoteText('');
                  handleSaveNote();
                }}
                className="mr-auto"
              >
                <X className="mr-1 size-4" />
                Remove Note
              </Button>
            )}
            <Button variant="outline" onClick={() => setNoteDialogItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
