"use client"

import { useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Share2, Heart, MessageSquare, Bookmark } from "lucide-react"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

interface Author {
  name: string
  image: string
  bio: string
}

interface BlogPostProps {
  title: string
  description: string
  content: string
  coverImage: string
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

  return (
    <article className="mx-auto max-w-3xl">
      {/* Header */}
      <header className="mb-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <a
              href={`/blogs/${category.toLowerCase()}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {category}
            </a>
            <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          </div>
          <p className="text-xl text-muted-foreground">{description}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative size-10">
                <Image
                  src={author.image}
                  alt={author.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div>
                <div className="font-medium">{author.name}</div>
                <div className="text-sm text-muted-foreground">
                  {format(publishedAt, "MMMM d, yyyy")} · {readingTime}
                </div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Heart
                  className={`size-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
                />
              </button>
              <button className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <MessageSquare className="size-4" />
              </button>
              <button
                onClick={() => setIsSaved(!isSaved)}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Bookmark
                  className={`size-4 ${isSaved ? "fill-primary text-primary" : ""}`}
                />
              </button>
              <button className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <Share2 className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative mb-8 aspect-video">
        <Image
          src={coverImage}
          alt={title}
          fill
          className="rounded-lg object-cover"
          priority
        />
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* Tags */}
      <div className="mt-8">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <a
              key={tag}
              href={`/blogs/tags/${tag.toLowerCase()}`}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors hover:bg-muted"
            >
              #{tag}
            </a>
          ))}
        </div>
      </div>

      {/* Author Bio */}
      <Card className="mt-8 p-6">
        <div className="flex items-start gap-4">
          <div className="relative size-16">
            <Image
              src={author.image}
              alt={author.name}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold">{author.name}</h3>
            <p className="mt-1 text-muted-foreground">{author.bio}</p>
            <a href="#" className={`${buttonVariants()} mt-4`}>
              Follow
            </a>
          </div>
        </div>
      </Card>
    </article>
  )
}
