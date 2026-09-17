import { Suspense } from 'react';
import type { Metadata } from 'next';
import CollectionsPageClient from './CollectionsPageClient';
import CollectionsPageSkeleton from './CollectionsPageSkeleton';
import { getProductValues } from '@/lib/products/values';

export const metadata: Metadata = {
  title: 'Collections',
  description:
    'Explore sustainable collections and filter products by category, rating, value, and price.',
};

// The catalogue reads the query string (`useSearchParams`) at the top of its
// client tree. On a statically prerendered route that bails the whole tree out
// to client rendering: the HTML carried only the Suspense fallback, the footer
// sat at y=446, and hydration then grew the document to ~3,600px - one layout
// shift worth 0.54 of a 0.59 CLS. Rendering this route per request instead
// puts the real page in the HTML, so the first frame and the hydrated frame
// are the same frame.
export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
  const values = await getProductValues();

  return (
    <Suspense fallback={<CollectionsPageSkeleton />}>
      <CollectionsPageClient initialValues={values} />
    </Suspense>
  );
}
