import Link from "next/link"
import { getTagCounts } from "@/lib/blog"
import { tagHref } from "@/lib/blog-utils"

export async function TagCloud() {
  const tags = await getTagCounts()

  if (tags.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h2 className="mb-4 font-semibold">Popular Topics</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={tagHref(tag)}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              #{tag} <span className="ml-1 text-muted-foreground">({count})</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
