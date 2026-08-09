export default function ImperfectLoading() {
  return (
    <div className="min-h-screen bg-muted">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 py-16 dark:from-amber-900/30 dark:via-orange-950/40 dark:to-yellow-900/30 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse text-center">
            <div className="mx-auto mb-6 h-10 w-48 rounded-full bg-card/60" />
            <div className="mx-auto mb-4 h-12 w-96 rounded-lg bg-card/60" />
            <div className="mx-auto mb-10 h-6 w-[600px] max-w-full rounded-lg bg-card/60" />
            <div className="flex justify-center gap-4">
              <div className="h-14 w-48 rounded-xl bg-card/60" />
              <div className="h-14 w-32 rounded-xl bg-card/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Filters skeleton */}
        <div className="mb-8 flex animate-pulse items-center justify-between">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="flex gap-4">
            <div className="h-10 w-36 rounded-lg bg-muted" />
            <div className="h-10 w-36 rounded-lg bg-muted" />
            <div className="h-10 w-36 rounded-lg bg-muted" />
          </div>
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square w-full rounded-xl bg-muted" />
              <div className="mt-4 space-y-3">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-6 w-1/3 rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
