"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { BlogCard } from "@/components/blogs/blog-card"
import { searchPosts, type BlogPost } from "@/lib/blog"

export function BlogSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<BlogPost[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true)
        try {
          const searchResults = await searchPosts(query)
          setResults(searchResults)
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
  }, [query])

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search articles..."
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      {query.trim() && (
        <div className="space-y-4">
          {isSearching ? (
            <p className="text-center text-muted-foreground">Searching...</p>
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
            <p className="text-center text-muted-foreground">
              No articles found for &quot;{query}&quot;
            </p>
          )}
        </div>
      )}
    </div>
  )
}
