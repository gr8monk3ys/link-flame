export default function BrandsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 h-8 w-36 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-6">
            <div className="mx-auto size-16 animate-pulse rounded-full bg-gray-200" />
            <div className="mx-auto h-5 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="mx-auto h-3 w-3/4 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
