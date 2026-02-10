export default function BrandsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 w-36 animate-pulse rounded bg-gray-200 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-3">
            <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200 mx-auto" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200 mx-auto" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
