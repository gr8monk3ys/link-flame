import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuth } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  handleApiError,
  rateLimitErrorResponse,
} from '@/lib/api-response';
import { checkRateLimit, checkStrictRateLimit, getIdentifier } from '@/lib/rate-limit';
import { validateCsrfToken } from '@/lib/csrf';
import { z } from 'zod';

/**
 * Product Reviews API
 *
 * GET  /api/products/[id]/reviews - Get all reviews for a product
 * POST /api/products/[id]/reviews - Create a review (authenticated users only)
 */

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be less than 1000 characters').optional(),
});

/**
 * GET /api/products/[id]/reviews
 *
 * Get all reviews for a product with pagination and sorting options
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);

    // Pagination
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);
    const offset = Number(searchParams.get('offset')) || 0;

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return notFoundResponse('Product');
    }

    // Fetch reviews with user information
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          [sortBy]: order,
        },
        take: limit,
        skip: offset,
      }),
      prisma.review.count({
        where: { productId },
      }),
    ]);

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      where: { productId },
      _avg: {
        rating: true,
      },
    });

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: {
        rating: true,
      },
    });

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratingDistribution.forEach((item) => {
      distribution[item.rating as keyof typeof distribution] = item._count.rating;
    });

    return successResponse(
      {
        reviews,
        averageRating: avgRating._avg.rating || 0,
        totalReviews: total,
        ratingDistribution: distribution,
      },
      {
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/products/[id]/reviews
 *
 * Create a new review for a product (authenticated users only)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF protection for review submissions
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    const { id: productId } = await params;

    // Check authentication
    const { userId } = await getServerAuth();
    if (!userId) {
      return unauthorizedResponse('You must be logged in to submit a review');
    }

    // Apply strict rate limiting for review submission (5 req/min) - user-generated content
    const identifier = getIdentifier(request, userId);
    const { success, reset } = await checkStrictRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return notFoundResponse('Product');
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId,
      },
    });

    if (existingReview) {
      return errorResponse(
        'You have already reviewed this product',
        'DUPLICATE_REVIEW',
        { reviewId: existingReview.id },
        400
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return successResponse(review, undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error);
    }

    return handleApiError(error);
  }
}
