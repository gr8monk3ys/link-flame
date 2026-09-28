"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { Share2, Heart, Bookmark } from "lucide-react"
import { AuthorAvatar } from "@/components/author-avatar"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { categoryHref, tagHref, type Author } from "@/lib/blog-utils"

interface BlogPostProps {
  title: string
  description: string
  content: string
  coverImage?: string
  publishedAt: Date
  author: Author
  category: string
  tags: string[]
  readingTime: string
}

export function BlogPost({
  title,
  description,
  content,
  coverImage,
  publishedAt,
  author,
  category,
  tags,
  readingTime,
}: BlogPostProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [shareStatus, setShareStatus] = useState("")

  async function handleShare() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareStatus("Link copied to clipboard")
    } catch {
      // User dismissed the share sheet or clipboard access was denied.
    }
  }

  return (
    <article className="mx-auto max-w-3xl">
      {/* Header */}
      <header className="mb-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Link
              href={categoryHref(category)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {category}
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          </div>
          <p className="text-xl text-muted-foreground">{description}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <AuthorAvatar author={author} size={40} />
              <div>
                <div className="font-medium">{author.name}</div>
                <div className="text-sm text-muted-foreground">
                  {format(publishedAt, "MMMM d, yyyy")} · {readingTime}
                </div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                aria-pressed={isLiked}
                aria-label="Like"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Heart
                  aria-hidden="true"
                  className={`size-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={() => setIsSaved(!isSaved)}
                aria-pressed={isSaved}
                aria-label="Save"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Bookmark
                  aria-hidden="true"
                  className={`size-4 ${isSaved ? "fill-primary text-primary" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Share2 aria-hidden="true" className="size-4" />
              </button>
              <span role="status" aria-live="polite" className="sr-only">
                {shareStatus}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {coverImage ? (
        <div className="relative mb-8 aspect-video">
          <Image
            src={coverImage}
            alt=""
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="rounded-lg object-cover"
            priority
          />
        </div>
      ) : null}

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* Tags */}
      <div className="mt-8">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={tagHref(tag)}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-muted"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Author Bio */}
      <Card className="mt-8 p-6">
        <div className="flex items-start gap-4">
          <AuthorAvatar author={author} size={64} />
          <div>
            <h2 className="font-semibold">About {author.name}</h2>
            <p className="mt-1 text-muted-foreground">{author.bio}</p>
          </div>
        </div>
      </Card>
    </article>
  )
}
