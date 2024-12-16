import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { BlogPost } from "@/lib/blog"

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const { slug, title, description, coverImage, publishedAt, author, category, tags, readingTime } = post

  return (
    <Card className={`overflow-hidden ${featured ? "md:grid md:grid-cols-2 md:gap-4" : ""}`}>
      <Link
        href={`/blogs/${category.toLowerCase()}/${slug}`}
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
            <Link
              href={`/blogs/${category.toLowerCase()}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {category}
            </Link>
            <Link href={`/blogs/${category.toLowerCase()}/${slug}`}>
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
              <div className="relative h-8 w-8">
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
                  {format(publishedAt, "MMM d, yyyy")} · {readingTime}
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
  )
}
