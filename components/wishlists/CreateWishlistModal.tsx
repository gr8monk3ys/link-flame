'use client';

import { useState } from 'react';
import { Plus, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CreateWishlistModalProps {
  onSubmit: (name: string, isPublic: boolean) => Promise<void>;
  trigger?: React.ReactNode;
}

export function CreateWishlistModal({ onSubmit, trigger }: CreateWishlistModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(name.trim(), isPublic);
      setIsOpen(false);
      setName('');
      setIsPublic(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wishlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Wishlist
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Wishlist</DialogTitle>
          <DialogDescription>
            Create a new wishlist to organize your saved items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Wishlist Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Gift Ideas, Kitchen Upgrades"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              maxLength={100}
            />
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Visibility</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                  !isPublic
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <Lock className="h-4 w-4" />
                <span>Private</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                  isPublic
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>Public</span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {isPublic
                ? 'Anyone with the link can view this wishlist'
                : 'Only you can see this wishlist'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </span>
            ) : (
              'Create Wishlist'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
