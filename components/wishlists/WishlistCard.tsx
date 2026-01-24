'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Lock, Globe, MoreVertical, Pencil, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  };
}

export interface Wishlist {
  id: string;
  visibleId: string;
  name: string;
  isDefault: boolean;
  isPublic: boolean;
  shareToken: string | null;
  itemCount: number;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

interface WishlistCardProps {
  wishlist: Wishlist;
  onRename?: (id: string, newName: string) => Promise<void>;
  onTogglePublic?: (id: string, isPublic: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onShare?: (shareToken: string) => void;
}

export function WishlistCard({
  wishlist,
  onRename,
  onTogglePublic,
  onDelete,
  onShare,
}: WishlistCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newName, setNewName] = useState(wishlist.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get up to 4 preview images
  const previewItems = wishlist.items.slice(0, 4);
  const hasMore = wishlist.itemCount > 4;

  const handleRename = async () => {
    if (!newName.trim() || newName === wishlist.name) {
      setShowRenameDialog(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onRename?.(wishlist.id, newName.trim());
      setShowRenameDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onDelete?.(wishlist.id);
      setShowDeleteDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublic = async () => {
    setIsSubmitting(true);
    try {
      await onTogglePublic?.(wishlist.id, !wishlist.isPublic);
    } finally {
      setIsSubmitting(false);
      setShowMenu(false);
    }
  };

  return (
    <>
      <div className="group relative rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-md">
        {/* Preview Grid */}
        <Link href={`/account/saved?wishlist=${wishlist.id}`}>
          <div className="aspect-square relative bg-muted">
            {previewItems.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="h-12 w-12 text-muted-foreground/30" />
              </div>
            ) : (
              <div className="grid grid-cols-2 h-full">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={cn(
                      'relative bg-muted',
                      index === 0 && 'border-r border-b',
                      index === 1 && 'border-b',
                      index === 2 && 'border-r'
                    )}
                  >
                    {previewItems[index] ? (
                      <Image
                        src={previewItems[index].product.image}
                        alt={previewItems[index].product.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : null}
                    {index === 3 && hasMore && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium">
                          +{wishlist.itemCount - 3}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Card Footer */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold line-clamp-1">{wishlist.name}</h3>
                {wishlist.isDefault && (
                  <Heart className="h-4 w-4 fill-red-500 text-red-500 flex-shrink-0" />
                )}
                {wishlist.isPublic ? (
                  <Globe className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {wishlist.itemCount} {wishlist.itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>

            {/* Action Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover shadow-md z-20">
                    {!wishlist.isDefault && (
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => {
                          setShowMenu(false);
                          setShowRenameDialog(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Rename
                      </button>
                    )}
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                      onClick={handleTogglePublic}
                      disabled={isSubmitting}
                    >
                      {wishlist.isPublic ? (
                        <>
                          <Lock className="h-4 w-4" />
                          Make Private
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4" />
                          Make Public
                        </>
                      )}
                    </button>
                    {wishlist.isPublic && wishlist.shareToken && (
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => {
                          onShare?.(wishlist.shareToken!);
                          setShowMenu(false);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                        Copy Share Link
                      </button>
                    )}
                    {!wishlist.isDefault && (
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Wishlist</DialogTitle>
            <DialogDescription>
              Enter a new name for your wishlist
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Wishlist name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Wishlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{wishlist.name}"? All items will be
              moved to your Favorites list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
