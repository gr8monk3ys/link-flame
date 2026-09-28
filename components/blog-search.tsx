"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { BlogCard } from "@/components/blog-card"
import { filterPosts, type BlogPost } from "@/lib/blog-utils"

interface BlogSearchProps {
  /** Posts are fetched on the server and passed in; filtering happens client-side. */
  posts: BlogPost[]
}

export function BlogSearch({ posts }: BlogSearchProps) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const results = useMemo(
    () => filterPosts(posts, deferredQuery),
    [posts, deferredQuery]
  )
  const hasQuery = deferredQuery.trim().length > 0

  return (
    <div className="w-full space-y-4" role="search">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          name="q"
          aria-label="Search articles"
          placeholder="Search articles…"
          autoComplete="off"
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div aria-live="polite">
        {hasQuery &&
          (results.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                Found {results.length} {results.length === 1 ? "result" : "results"}
              </h2>
              <div className="grid gap-6">
                {results.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No articles found for &ldquo;{deferredQuery}&rdquo;
            </p>
          ))}
      </div>
    </div>
  )
}
