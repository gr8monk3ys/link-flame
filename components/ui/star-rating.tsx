import { Star, StarHalf } from "lucide-react"

interface StarRatingProps {
  rating: number
  maxRating?: number
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  className = "",
}: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  return (
    <div className={`flex items-center ${className}`}>
      {[...Array(maxRating)].map((_, i) => {
        if (i < fullStars) {
          return (
            <Star
              key={i}
              className="h-4 w-4 fill-primary text-primary"
              aria-hidden="true"
            />
          )
        } else if (i === fullStars && hasHalfStar) {
          return (
            <StarHalf
              key={i}
              className="h-4 w-4 fill-primary text-primary"
              aria-hidden="true"
            />
          )
        }
        return (
          <Star
            key={i}
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
        )
      })}
      <span className="sr-only">{rating} out of {maxRating} stars</span>
    </div>
  )
}
