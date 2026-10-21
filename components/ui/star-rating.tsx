import { Star, StarHalf } from "lucide-react"

import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  className?: string
}

// Filled stars are Moss ink; empty stars are the hairline tone. The number is
// read out to assistive tech, since the glyphs alone are decoration.
export function StarRating({
  rating,
  maxRating = 5,
  className,
}: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  return (
    <div className={cn("flex items-center", className)}>
      {[...Array(maxRating)].map((_, i) => {
        if (i < fullStars) {
          return (
            <Star
              key={i}
              className="size-4 fill-primary text-primary"
              aria-hidden="true"
            />
          )
        } else if (i === fullStars && hasHalfStar) {
          return (
            <StarHalf
              key={i}
              className="size-4 fill-primary text-primary"
              aria-hidden="true"
            />
          )
        }
        return (
          <Star
            key={i}
            className="size-4 text-border"
            aria-hidden="true"
          />
        )
      })}
      <span className="sr-only">{rating} out of {maxRating} stars</span>
    </div>
  )
}
