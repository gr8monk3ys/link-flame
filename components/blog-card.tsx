import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { AuthorAvatar } from "@/components/author-avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  categoryHref,
  postHref,
  tagHref,
  type BlogPost,
} from "@/lib/blog-utils"

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const { title, description, coverImage, publishedAt, author, category, tags, readingTime } = post
  const href = postHref(post)

  return (
    <Card className={`overflow-hidden ${featured ? "md:grid md:grid-cols-2 md:gap-4" : ""}`}>
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className={`relative block overflow-hidden ${featured ? "aspect-[2/1] md:aspect-square" : "aspect-[2/1]"}`}
      >
        <Image
          src={coverImage}
          alt=""
          fill
          sizes={featured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
          className="object-cover transition-transform duration-300 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
        />
      </Link>
      <div>
        <CardHeader>
          <div className="space-y-1">
            <Link
              href={categoryHref(category)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {category}
            </Link>
            <Link href={href}>
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
              <AuthorAvatar author={author} size={32} />
              <div className="text-sm">
                <div className="font-medium">{author.name}</div>
                <div className="text-muted-foreground">
                  <time dateTime={publishedAt.toISOString()}>
                    {format(publishedAt, "MMM d, yyyy")}
                  </time>{" "}
                  · {readingTime}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={tagHref(tag)}
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
