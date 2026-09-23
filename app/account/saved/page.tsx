import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SavedItemsClient from './SavedItemsClient';

function SavedItemsLoading() {
  return (
    <div className="container flex items-center justify-center py-10">
      <span role="status"><span className="inline-flex shrink-0 animate-spin"><Loader2 className="size-8" /></span><span className="sr-only">Loading…</span></span>
    </div>
  );
}

export default function SavedItemsPage() {
  return (
    <Suspense fallback={<SavedItemsLoading />}>
      <SavedItemsClient />
    </Suspense>
  );
}
