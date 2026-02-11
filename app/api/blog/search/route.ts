import { NextRequest } from 'next/server';
import { searchPosts } from '@/lib/blog';
import { errorResponse, paginatedResponse, handleApiError, validationErrorResponse, rateLimitErrorResponse } from '@/lib/api-response';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic'

/**
 * Blog Search API Endpoint
 *
 * GET /api/blog/search?q={query}&category={category}&tag={tag}&page={page}&limit={limit}
 *
 * Searches blog posts by query, optionally filtered by category and/or tag.
 *
 * **Query Parameters:**
 * - `q` (optional): Search query string
 * - `category` (optional): Filter by category name
 * - `tag` (optional): Filter by tag
 * - `page` (optional, default: 1): Page number
 * - `limit` (optional, default: 20, max: 50): Items per page
 *
 * **Response: 200 OK**
 * {
 *   "success": true,
 *   "data": [...posts],
 *   "meta": {
 *     "timestamp": "...",
 *     "pagination": {
 *       "page": 1,
 *       "limit": 20,
 *       "total": 50,
 *       "totalPages": 3,
 *       "hasNextPage": true,
 *       "hasPreviousPage": false
 *     }
 *   }
 * }
 *
 * **Example:**
 * ```
 * GET /api/blog/search?q=sustainable&category=Lifestyle&page=1&limit=10
 * ```
 */

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting to prevent search abuse
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const validation = searchSchema.safeParse({
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    });

    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { q, category, tag, page, limit } = validation.data;

    // If no search parameters provided, return empty results
    if (!q && !category && !tag) {
      return paginatedResponse([], {
        page: 1,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    }

    // Search posts
    let results = q ? await searchPosts(q) : [];

    // If no query but category/tag provided, need to fetch all posts first
    if (!q && (category || tag)) {
      const { getPostsByCategory, getPostsByTag } = await import('@/lib/blog');

      if (category && tag) {
        // Filter by both category and tag
        const categoryPosts = await getPostsByCategory(category);
        results = categoryPosts.filter(post =>
          post.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
        );
      } else if (category) {
        results = await getPostsByCategory(category);
      } else if (tag) {
        results = await getPostsByTag(tag);
      }
    } else if (q && (category || tag)) {
      // Apply additional filters to search results
      if (category) {
        results = results.filter(post =>
          post.category?.toLowerCase() === category.toLowerCase()
        );
      }
      if (tag) {
        results = results.filter(post =>
          post.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
        );
      }
    }

    // Calculate pagination
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Apply pagination
    const paginatedResults = results.slice(skip, skip + limit);

    return paginatedResponse(paginatedResults, {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error);
    }

    return handleApiError(error);
  }
}
