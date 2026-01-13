import { NextResponse } from 'next/server';
import { searchPosts } from '@/lib/blog';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-response';
import { z } from 'zod';

/**
 * Blog Search API Endpoint
 *
 * GET /api/blog/search?q={query}&category={category}&tag={tag}
 *
 * Searches blog posts by query, optionally filtered by category and/or tag.
 *
 * **Query Parameters:**
 * - `q` (optional): Search query string
 * - `category` (optional): Filter by category name
 * - `tag` (optional): Filter by tag
 * - `limit` (optional): Maximum number of results (default: 50)
 *
 * **Example:**
 * ```
 * GET /api/blog/search?q=sustainable&category=Lifestyle&limit=10
 * ```
 */

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const params = searchSchema.parse({
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      tag: searchParams.get('tag') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const { q, category, tag, limit } = params;

    // If no search parameters provided, return empty results
    if (!q && !category && !tag) {
      return successResponse([], {
        count: 0,
        query: params,
      });
    }

    // Search posts
    let results = q ? await searchPosts(q) : [];

    // If no query but category/tag provided, need to fetch all posts first
    if (!q && (category || tag)) {
      const { getAllPosts, getPostsByCategory, getPostsByTag } = await import('@/lib/blog');

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

    // Apply limit
    const limitedResults = results.slice(0, limit);

    return successResponse(limitedResults, {
      count: limitedResults.length,
      total: results.length,
      query: params,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        'Invalid search parameters',
        'VALIDATION_ERROR',
        error.errors,
        400
      );
    }

    return handleApiError(error);
  }
}
