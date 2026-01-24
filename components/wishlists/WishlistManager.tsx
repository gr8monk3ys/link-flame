'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WishlistCard, type Wishlist } from './WishlistCard';
import { WishlistItems, type WishlistItem } from './WishlistItems';
import { ShareWishlistButton } from './ShareWishlistButton';
import { cn } from '@/lib/utils';

const CreateWishlistModal = dynamic(
  () => import('./CreateWishlistModal').then((mod) => mod.CreateWishlistModal),
  { ssr: false, loading: () => null }
);

interface WishlistManagerProps {
  wishlists: Wishlist[];
  selectedWishlistId?: string;
  onSelectWishlist: (id: string | null) => void;
  onCreateWishlist: (name: string, isPublic: boolean) => Promise<void>;
  onRenameWishlist: (id: string, newName: string) => Promise<void>;
  onTogglePublic: (id: string, isPublic: boolean) => Promise<void>;
  onDeleteWishlist: (id: string) => Promise<void>;
  onRemoveItem: (wishlistId: string, productId: string) => Promise<void>;
  onMoveToCart: (item: WishlistItem) => Promise<void>;
  onMoveItem: (fromWishlistId: string, toWishlistId: string, productId: string) => Promise<void>;
  onUpdateNote: (itemId: string, note: string | null) => Promise<void>;
  onShareLink: (shareToken: string) => void;
  isLoading?: boolean;
}

export function WishlistManager({
  wishlists,
  selectedWishlistId,
  onSelectWishlist,
  onCreateWishlist,
  onRenameWishlist,
  onTogglePublic,
  onDeleteWishlist,
  onRemoveItem,
  onMoveToCart,
  onMoveItem,
  onUpdateNote,
  onShareLink,
  isLoading = false,
}: WishlistManagerProps) {
  const selectedWishlist = wishlists.find((w) => w.id === selectedWishlistId);

  // Grid view - show all wishlists
  if (!selectedWishlist) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Wishlists</h1>
            <p className="text-muted-foreground">
              {wishlists.length} {wishlists.length === 1 ? 'list' : 'lists'} /{' '}
              {wishlists.reduce((sum, w) => sum + w.itemCount, 0)} total items
            </p>
          </div>
          <CreateWishlistModal onSubmit={onCreateWishlist} />
        </div>

        {/* Wishlist Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : wishlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No wishlists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first wishlist to start saving items
            </p>
            <CreateWishlistModal onSubmit={onCreateWishlist} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlists.map((wishlist) => (
              <WishlistCard
                key={wishlist.id}
                wishlist={wishlist}
                onRename={onRenameWishlist}
                onTogglePublic={onTogglePublic}
                onDelete={onDeleteWishlist}
                onShare={onShareLink}
              />
            ))}

            {/* Add New Card */}
            <CreateWishlistModal
              onSubmit={onCreateWishlist}
              trigger={
                <button className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Plus className="h-8 w-8" />
                  <span className="font-medium">New Wishlist</span>
                </button>
              }
            />
          </div>
        )}
      </div>
    );
  }

  // Detail view - show single wishlist items
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            onClick={() => onSelectWishlist(null)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            All Wishlists
          </Button>
          <h1 className="text-2xl font-bold">{selectedWishlist.name}</h1>
          <p className="text-muted-foreground">
            {selectedWishlist.itemCount}{' '}
            {selectedWishlist.itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedWishlist.isPublic && selectedWishlist.shareToken && (
            <ShareWishlistButton
              shareToken={selectedWishlist.shareToken}
              wishlistName={selectedWishlist.name}
            />
          )}
        </div>
      </div>

      {/* Items */}
      <WishlistItems
        items={selectedWishlist.items}
        wishlists={wishlists.map((w) => ({ id: w.id, name: w.name }))}
        currentWishlistId={selectedWishlist.id}
        onRemove={(productId) => onRemoveItem(selectedWishlist.id, productId)}
        onMoveToCart={onMoveToCart}
        onMoveTo={(productId, toWishlistId) =>
          onMoveItem(selectedWishlist.id, toWishlistId, productId)
        }
        onUpdateNote={onUpdateNote}
        isLoading={isLoading}
      />
    </div>
  );
}
