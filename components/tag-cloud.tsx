import Link from "next/link"
import { getAllPosts } from "@/lib/blog"

export function TagCloud() {
  // Get all unique tags and their counts
  const tags = getAllPosts().reduce((acc, post) => {
    post.tags.forEach((tag) => {
      const normalizedTag = tag.toLowerCase()
      acc[normalizedTag] = (acc[normalizedTag] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  // Convert to array and sort by count
  const sortedTags = Object.entries(tags)
    .sort(([, a], [, b]) => b - a)
    .map(([tag, count]) => ({ tag, count }))

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="mb-4 font-semibold">Popular Topics</h3>
        <div className="flex flex-wrap gap-2">
          {sortedTags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/blogs/tags/${tag}`}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-muted"
            >
              #{tag} <span className="ml-1 text-muted-foreground">({count})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
