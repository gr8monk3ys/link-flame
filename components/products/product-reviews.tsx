"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Star, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

interface ReviewData {
  reviews: Review[]
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data: session } = useSession()
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Form state
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}/reviews`)
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }
      const data = await response.json()
      setReviewData(data.data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user) {
      toast.error('Please sign in to submit a review')
      return
    }

    if (rating < 1 || rating > 5) {
      toast.error('Please select a rating')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit review')
      }

      toast.success('Review submitted successfully!')
      setShowReviewForm(false)
      setRating(5)
      setComment("")
      fetchReviews() // Refresh reviews
    } catch (error: any) {
      console.error('Error submitting review:', error)
      toast.error(error.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading reviews...
      </div>
    )
  }

  if (!reviewData) {
    return null
  }

  const { reviews, averageRating, totalReviews, ratingDistribution } = reviewData

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center md:items-start">
          <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`size-5 ${
                  star <= Math.round(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating as keyof typeof ratingDistribution]
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

            return (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm w-16">{rating} star</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Write Review Button */}
      <div>
        {session?.user ? (
          !showReviewForm ? (
            <Button onClick={() => setShowReviewForm(true)}>
              Write a Review
            </Button>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4 border rounded-lg p-6">
              <h3 className="font-semibold text-lg">Write Your Review</h3>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Rating *
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`size-8 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Comment (optional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  maxLength={1000}
                />
                {comment.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {comment.length}/1000 characters
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowReviewForm(false)
                    setRating(5)
                    setComment("")
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="size-4" />
            <span>Please sign in to write a review</span>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="font-semibold text-xl">Customer Reviews</h3>

        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-6">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  {review.user.image ? (
                    <img
                      src={review.user.image}
                      alt={review.user.name || 'User'}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {review.user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}

                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {review.user.name || 'Anonymous'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`size-4 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {review.comment && (
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
