export default function AdminLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border">
        <div className="h-10 w-full animate-pulse rounded-t bg-gray-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-t p-4">
            <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/6 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/6 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
