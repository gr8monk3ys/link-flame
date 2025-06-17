import { Suspense } from 'react'
import { Metadata } from 'next'
import { SearchResults } from './SearchResults'
import { Skeleton } from '@/components/ui/loading-shimmer'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for products, categories, and blog posts on Link Flame.',
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {query ? `Search results for "${query}"` : 'Search'}
        </h1>
        {query && (
          <p className="mt-2 text-muted-foreground">
            Find products, categories, and blog posts matching your search.
          </p>
        )}
      </div>

      {query ? (
        <Suspense fallback={<SearchResultsLoading />}>
          <SearchResults query={query} />
        </Suspense>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <h2 className="text-xl font-semibold">Start searching</h2>
          <p className="mt-2 text-muted-foreground">
            Enter a search term in the search box above to find products, categories, and blog posts.
          </p>
        </div>
      )}
    </div>
  )
}

function SearchResultsLoading() {
  return (
    <div className="space-y-8">
      {/* Products section skeleton */}
      <section>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <Skeleton className="mb-4 aspect-square w-full" />
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>

      {/* Categories section skeleton */}
      <section>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>
      </section>

      {/* Blog posts section skeleton */}
      <section>
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-lg border p-4">
              <Skeleton className="size-24 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
