export default function CartLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 w-36 animate-pulse rounded bg-gray-200 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-lg border p-4">
            <div className="h-24 w-24 animate-pulse rounded bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 h-12 w-48 animate-pulse rounded bg-gray-200 ml-auto" />
    </div>
  )
}
