import { Suspense } from 'react';
import type { Metadata } from 'next';
import CollectionsPageClient from './CollectionsPageClient';

export const metadata: Metadata = {
  title: 'Collections | Link Flame',
  description:
    'Explore sustainable collections and filter products by category, rating, value, and price.',
};

function CollectionsPageFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-40 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={<CollectionsPageFallback />}>
      <CollectionsPageClient />
    </Suspense>
  );
}
