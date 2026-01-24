'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SearchSuggestionsResponse } from '@/lib/types/search'
import {
  ProductResult,
  CategoryResult,
  BlogPostResult,
  RecentSearchResult,
} from './SearchResult'
import { Skeleton } from '@/components/ui/loading-shimmer'

interface SearchSuggestionsProps {
  suggestions: SearchSuggestionsResponse | null
  recentSearches: string[]
  isLoading: boolean
  error: string | null
  query: string
  selectedIndex: number
  onSelectRecentSearch: (query: string) => void
  onRemoveRecentSearch: (query: string) => void
  onResultSelect: () => void
  className?: string
}

export function SearchSuggestions({
  suggestions,
  recentSearches,
  isLoading,
  error,
  query,
  selectedIndex,
  onSelectRecentSearch,
  onRemoveRecentSearch,
  onResultSelect,
  className,
}: SearchSuggestionsProps) {
  const trimmedQuery = query.trim()
  const showRecentSearches = !trimmedQuery && recentSearches.length > 0
  const showSuggestions = trimmedQuery.length >= 2 && suggestions
  const showNoResults =
    trimmedQuery.length >= 2 &&
    !isLoading &&
    !error &&
    suggestions &&
    suggestions.products.length === 0 &&
    suggestions.categories.length === 0 &&
    suggestions.blogPosts.length === 0

  // Calculate total navigable items for keyboard navigation
  let itemIndex = 0

  return (
    <div
      className={cn(
        'absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-lg border bg-popover shadow-lg',
        className
      )}
      role="listbox"
      aria-label="Search suggestions"
    >
      <div className="max-h-[400px] overflow-y-auto p-2">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2 p-2">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="size-12" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Please try again later
            </p>
          </div>
        )}

        {/* Recent Searches */}
        {showRecentSearches && !isLoading && !error && (
          <div>
            <div className="flex items-center justify-between px-3 py-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                Recent Searches
              </h3>
            </div>
            <div className="space-y-1">
              {recentSearches.map((recentQuery) => {
                const currentIndex = itemIndex++
                return (
                  <RecentSearchResult
                    key={recentQuery}
                    query={recentQuery}
                    isHighlighted={selectedIndex === currentIndex}
                    onSelect={() => onSelectRecentSearch(recentQuery)}
                    onRemove={() => onRemoveRecentSearch(recentQuery)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* No Results State */}
        {showNoResults && (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No results found for &quot;{trimmedQuery}&quot;
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try different keywords or browse our{' '}
              <Link
                href="/collections"
                className="text-primary hover:underline"
                onClick={onResultSelect}
              >
                collections
              </Link>
            </p>
          </div>
        )}

        {/* Search Results */}
        {showSuggestions && !isLoading && !error && (
          <>
            {/* Products */}
            {suggestions.products.length > 0 && (
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  Products
                </h3>
                <div className="space-y-1">
                  {suggestions.products.map((product) => {
                    const currentIndex = itemIndex++
                    return (
                      <ProductResult
                        key={product.id}
                        product={product}
                        isHighlighted={selectedIndex === currentIndex}
                        onSelect={onResultSelect}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Categories */}
            {suggestions.categories.length > 0 && (
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  Categories
                </h3>
                <div className="space-y-1">
                  {suggestions.categories.map((category) => {
                    const currentIndex = itemIndex++
                    return (
                      <CategoryResult
                        key={category.name}
                        category={category}
                        isHighlighted={selectedIndex === currentIndex}
                        onSelect={onResultSelect}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Blog Posts */}
            {suggestions.blogPosts.length > 0 && (
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  Blog Posts
                </h3>
                <div className="space-y-1">
                  {suggestions.blogPosts.map((post) => {
                    const currentIndex = itemIndex++
                    return (
                      <BlogPostResult
                        key={post.id}
                        post={post}
                        isHighlighted={selectedIndex === currentIndex}
                        onSelect={onResultSelect}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* See All Results Link */}
            {(suggestions.products.length > 0 ||
              suggestions.categories.length > 0 ||
              suggestions.blogPosts.length > 0) && (
              <div className="mt-2 border-t pt-2">
                <Link
                  href={`/search?q=${encodeURIComponent(trimmedQuery)}`}
                  onClick={onResultSelect}
                  className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
                >
                  See all results for &quot;{trimmedQuery}&quot;
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </>
        )}

        {/* Prompt to type more */}
        {trimmedQuery.length > 0 &&
          trimmedQuery.length < 2 &&
          !isLoading &&
          !error && (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Type at least 2 characters to search
              </p>
            </div>
          )}
      </div>
    </div>
  )
}
