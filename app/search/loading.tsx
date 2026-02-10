export default function SearchLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-10 w-full max-w-lg animate-pulse rounded bg-gray-200 mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-lg border p-4">
            <div className="h-20 w-20 animate-pulse rounded bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
