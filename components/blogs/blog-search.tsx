"use client"

import { useState, useEffect } from "react"
import { Search, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BlogCard } from "@/components/blogs/blog-card"
import type { BlogPost } from "@/lib/blog"

interface BlogSearchProps {
  categories?: string[]
  tags?: string[]
}

export function BlogSearch({ categories = [], tags = [] }: BlogSearchProps) {
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedTag, setSelectedTag] = useState<string>("")
  const [results, setResults] = useState<BlogPost[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim() || selectedCategory || selectedTag) {
        setIsSearching(true)
        try {
          // Build query string
          const params = new URLSearchParams()
          if (query.trim()) params.append('q', query.trim())
          if (selectedCategory) params.append('category', selectedCategory)
          if (selectedTag) params.append('tag', selectedTag)

          // Fetch from search API
          const response = await fetch(`/api/blog/search?${params.toString()}`)
          if (!response.ok) {
            throw new Error('Search failed')
          }

          const data = await response.json()
          setResults(data.data || [])
        } catch (error) {
          console.error('Error searching posts:', error)
          setResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, selectedCategory, selectedTag])

  const clearFilters = () => {
    setQuery("")
    setSelectedCategory("")
    setSelectedTag("")
    setResults([])
  }

  const hasActiveFilters = query.trim() || selectedCategory || selectedTag
  const showFilterOptions = categories.length > 0 || tags.length > 0

  return (
    <div className="w-full space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search articles..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {showFilterOptions && (
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters"
          >
            <Filter className="size-4" />
          </Button>
        )}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            title="Clear all filters"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && showFilterOptions && (
        <div className="flex flex-wrap gap-4 rounded-lg border p-4">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tag Filter */}
          {tags.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Tag</label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Tags</option>
                {tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          {query.trim() && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
              Query: &quot;{query}&quot;
              <button
                onClick={() => setQuery("")}
                className="hover:text-destructive"
                title="Remove filter"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
              Category: {selectedCategory}
              <button
                onClick={() => setSelectedCategory("")}
                className="hover:text-destructive"
                title="Remove filter"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          {selectedTag && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
              Tag: {selectedTag}
              <button
                onClick={() => setSelectedTag("")}
                className="hover:text-destructive"
                title="Remove filter"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Search Results */}
      {hasActiveFilters && (
        <div className="space-y-4">
          {isSearching ? (
            <p className="text-center text-muted-foreground py-8">Searching...</p>
          ) : results.length > 0 ? (
            <>
              <h2 className="text-lg font-semibold">
                Found {results.length} {results.length === 1 ? "result" : "results"}
              </h2>
              <div className="grid gap-6">
                {results.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No articles found matching your search criteria
            </p>
          )}
        </div>
      )}
    </div>
  )
}
