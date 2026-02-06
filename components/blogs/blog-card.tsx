import Image from "next/image"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { BlogPost } from "@/lib/blog"

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const { slug, title, description, coverImage, publishedAt, author, category, tags, readingTime } = post
  const formattedDate = typeof publishedAt === 'string'
    ? format(parseISO(publishedAt), "MMM d, yyyy")
    : format(publishedAt, "MMM d, yyyy")

  const categorySlug = category ? category.toLowerCase() : 'uncategorized'

  return (
    <article data-testid="blog-card" className="h-full">
      <Card className={`overflow-hidden ${featured ? "md:grid md:grid-cols-2 md:gap-4" : ""}`}>
        <Link
          href={`/blogs/${slug}`}
          data-testid="blog-post-link"
          className={`relative block ${featured ? "aspect-[2/1] md:aspect-square" : "aspect-[2/1]"}`}
        >
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
        </Link>
        <div>
          <CardHeader>
            <div className="space-y-1">
              {category && (
                <Link
                  href={`/blogs/categories/${categorySlug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {category}
                </Link>
              )}
              <Link href={`/blogs/${slug}`} data-testid="blog-post-link">
                <h3 className={`font-bold hover:underline ${featured ? "text-2xl" : "text-xl"}`}>
                  {title}
                </h3>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 line-clamp-2 text-muted-foreground">{description}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="relative size-8">
                  <Image
                    src={author.image}
                    alt={author.name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <div className="text-sm">
                  <div className="font-medium">{author.name}</div>
                  <div className="text-muted-foreground">
                    <time dateTime={typeof publishedAt === 'string' ? publishedAt : publishedAt.toISOString()}>
                      {formattedDate}
                    </time>
                    <span> · </span>
                    <span>{readingTime}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <Link
                  key={tag}
                  href={`/blogs/tags/${tag.toLowerCase()}`}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-muted"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </CardContent>
        </div>
      </Card>
    </article>
  )
}
