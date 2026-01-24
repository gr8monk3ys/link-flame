'use client';

import { useState } from 'react';
import { Heart, ChevronRight, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface WishlistOption {
  id: string;
  name: string;
  isDefault: boolean;
  itemCount: number;
}

interface MoveToWishlistMenuProps {
  wishlists: WishlistOption[];
  currentWishlistId?: string;
  productTitle: string;
  onMove: (toWishlistId: string) => Promise<void>;
  onCreateNew?: (name: string) => Promise<string>; // Returns new wishlist ID
  trigger: React.ReactNode;
}

export function MoveToWishlistMenu({
  wishlists,
  currentWishlistId,
  productTitle,
  onMove,
  onCreateNew,
  trigger,
}: MoveToWishlistMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const otherWishlists = wishlists.filter((w) => w.id !== currentWishlistId);

  const handleMove = async (toWishlistId: string) => {
    setSelectedId(toWishlistId);
    setIsSubmitting(true);
    try {
      await onMove(toWishlistId);
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
      setSelectedId(null);
    }
  };

  const handleCreateAndMove = async () => {
    if (!newListName.trim() || !onCreateNew) return;

    setIsSubmitting(true);
    try {
      const newWishlistId = await onCreateNew(newListName.trim());
      await onMove(newWishlistId);
      setNewListName('');
      setIsCreating(false);
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{trigger}</div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move to Wishlist</DialogTitle>
            <DialogDescription className="line-clamp-1">
              Move "{productTitle}" to another wishlist
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {otherWishlists.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No other wishlists available
              </p>
            ) : (
              otherWishlists.map((wishlist) => (
                <button
                  key={wishlist.id}
                  onClick={() => handleMove(wishlist.id)}
                  disabled={isSubmitting}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border p-3 transition-colors',
                    'hover:bg-muted disabled:opacity-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Heart
                      className={cn(
                        'size-5',
                        wishlist.isDefault
                          ? 'fill-red-500 text-red-500'
                          : 'text-muted-foreground'
                      )}
                    />
                    <div className="text-left">
                      <p className="font-medium">{wishlist.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {wishlist.itemCount} {wishlist.itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  {selectedId === wishlist.id ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <ChevronRight className="size-5 text-muted-foreground" />
                  )}
                </button>
              ))
            )}
          </div>

          {onCreateNew && (
            <>
              {isCreating ? (
                <div className="space-y-3 border-t pt-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="New wishlist name"
                    className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateAndMove();
                      if (e.key === 'Escape') setIsCreating(false);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCreating(false);
                        setNewListName('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCreateAndMove}
                      disabled={!newListName.trim() || isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Creating...' : 'Create & Move'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(true)}
                  className="mt-2 w-full"
                >
                  <Plus className="mr-2 size-4" />
                  Create New Wishlist
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
