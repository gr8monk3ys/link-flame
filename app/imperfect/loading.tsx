export default function ImperfectLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-pulse">
            <div className="mx-auto h-10 w-48 rounded-full bg-white/60 mb-6" />
            <div className="mx-auto h-12 w-96 rounded-lg bg-white/60 mb-4" />
            <div className="mx-auto h-6 w-[600px] max-w-full rounded-lg bg-white/60 mb-10" />
            <div className="flex justify-center gap-4">
              <div className="h-14 w-48 rounded-xl bg-white/60" />
              <div className="h-14 w-32 rounded-xl bg-white/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Filters skeleton */}
        <div className="mb-8 flex items-center justify-between animate-pulse">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="flex gap-4">
            <div className="h-10 w-36 rounded-lg bg-gray-200" />
            <div className="h-10 w-36 rounded-lg bg-gray-200" />
            <div className="h-10 w-36 rounded-lg bg-gray-200" />
          </div>
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square w-full rounded-xl bg-gray-200" />
              <div className="mt-4 space-y-3">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                <div className="h-6 w-1/3 rounded bg-gray-200" />
                <div className="h-4 w-2/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
