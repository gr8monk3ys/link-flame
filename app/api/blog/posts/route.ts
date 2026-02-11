import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError, paginatedResponse, validationErrorResponse } from '@/lib/api-response'
import { transformPrismaPost } from '@/lib/transformations/blog'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Cache blog posts for 1 hour (3600 seconds) for better performance
// Remove this line if you need real-time updates
export const revalidate = 3600

// Query parameter validation schema
const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
})

/**
 * GET /api/blog/posts
 *
 * Returns paginated list of blog posts
 *
 * Query Parameters:
 * - page: number (optional, default: 1) - Page number
 * - limit: number (optional, default: 10, max: 50) - Items per page
 * - category: string (optional) - Filter by category name
 * - featured: 'true' | 'false' (optional) - Filter by featured status
 *
 * Response: 200 OK
 * {
 *   "success": true,
 *   "data": [...posts],
 *   "meta": {
 *     "timestamp": "...",
 *     "pagination": {
 *       "page": 1,
 *       "limit": 10,
 *       "total": 25,
 *       "totalPages": 3,
 *       "hasNextPage": true,
 *       "hasPreviousPage": false
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      category: searchParams.get('category') || undefined,
      featured: searchParams.get('featured') || undefined,
    }

    const validation = querySchema.safeParse(queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { page, limit, category, featured } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (category) {
      where.category = {
        name: category,
      }
    }

    if (featured !== undefined) {
      where.featured = featured === 'true'
    }

    // Get total count for pagination
    const total = await prisma.blogPost.count({ where })

    // Get paginated posts
    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        author: true,
        category: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return paginatedResponse(posts.map(transformPrismaPost), {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    })
  } catch (error) {
    logger.error('Failed to fetch blog posts', error)
    return handleApiError(error)
  }
}
