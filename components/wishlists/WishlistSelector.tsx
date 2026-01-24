'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Heart, Check } from 'lucide-react';
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

interface WishlistSelectorProps {
  wishlists: WishlistOption[];
  selectedWishlistId?: string;
  onSelect: (wishlistId: string) => void;
  onCreateNew: (name: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function WishlistSelector({
  wishlists,
  selectedWishlistId,
  onSelect,
  onCreateNew,
  isLoading = false,
  className,
}: WishlistSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWishlist = wishlists.find((w) => w.id === selectedWishlistId);

  const handleCreateNew = async () => {
    if (!newListName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateNew(newListName.trim());
      setNewListName('');
      setIsCreating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={cn('relative', className)}>
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsOpen(true)}
          disabled={isLoading}
        >
          <span className="flex items-center gap-2">
            <Heart className="size-4" />
            {selectedWishlist ? selectedWishlist.name : 'Select wishlist'}
          </span>
          <ChevronDown className="size-4 opacity-50" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Wishlist</DialogTitle>
            <DialogDescription>
              Choose a wishlist or create a new one
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {wishlists.map((wishlist) => (
              <button
                key={wishlist.id}
                onClick={() => {
                  onSelect(wishlist.id);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border p-3 transition-colors',
                  selectedWishlistId === wishlist.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-3">
                  <Heart
                    className={cn(
                      'size-5',
                      wishlist.isDefault ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                    )}
                  />
                  <div className="text-left">
                    <p className="font-medium">{wishlist.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {wishlist.itemCount} {wishlist.itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
                {selectedWishlistId === wishlist.id && (
                  <Check className="size-5 text-primary" />
                )}
              </button>
            ))}
          </div>

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
                  if (e.key === 'Enter') handleCreateNew();
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
                  onClick={handleCreateNew}
                  disabled={!newListName.trim() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
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
        </DialogContent>
      </Dialog>
    </>
  );
}
