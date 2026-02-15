export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 h-8 w-36 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="space-y-4 rounded-lg border p-6">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
          <div className="mt-4 h-12 w-full animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}
