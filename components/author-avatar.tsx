import Image from "next/image"

import { initials, type Author } from "@/lib/blog-utils"
import { cn } from "@/lib/utils"

interface AuthorAvatarProps {
  author: Pick<Author, "name" | "image">
  /** Rendered size in px (square). */
  size: number
  className?: string
}

/** Author photo, or their initials when no image is available. Decorative: the name is always shown next to it. */
export function AuthorAvatar({ author, size, className }: AuthorAvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {author.image ? (
        <Image src={author.image} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        initials(author.name)
      )}
    </div>
  )
}
