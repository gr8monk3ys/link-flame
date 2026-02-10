import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  rateLimitErrorResponse,
} from '@/lib/api-response'
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

/**
 * Search Suggestions API Endpoint
 *
 * GET /api/search/suggestions?q={query}
 *
 * Returns predictive search suggestions including:
 * - Top 5 product matches
 * - Top 3 category matches
 * - Top 2 blog post matches
 *
 * Optimized for fast response times to support autocomplete functionality.
 *
 * **Query Parameters:**
 * - `q` (required): Search query string (min 2 characters)
 *
 * **Response: 200 OK**
 * {
 *   "success": true,
 *   "data": {
 *     "products": [...],
 *     "categories": [...],
 *     "blogPosts": [...]
 *   },
 *   "meta": {
 *     "timestamp": "...",
 *     "query": "...",
 *     "totalResults": 10
 *   }
 * }
 */

const searchSchema = z.object({
  q: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query is too long'),
})

// Type definitions for search results
interface ProductSuggestion {
  id: string
  title: string
  price: number
  salePrice: number | null
  image: string
  category: string
  slug: string
}

interface CategorySuggestion {
  name: string
  count: number
}

interface BlogPostSuggestion {
  id: string
  title: string
  slug: string
  coverImage: string | null
  category: string | null
  publishedAt: Date
}

interface SearchSuggestionsResponse {
  products: ProductSuggestion[]
  categories: CategorySuggestion[]
  blogPosts: BlogPostSuggestion[]
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - use standard limit for search suggestions
    const identifier = getIdentifier(request)
    const { success, reset } = await checkRateLimit(`search:${identifier}`)
    if (!success) {
      return rateLimitErrorResponse(reset)
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    // Validate query
    const validation = searchSchema.safeParse({ q: query })
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const searchQuery = validation.data.q.toLowerCase().trim()

    // Execute all searches in parallel for faster response
    const [products, categories, blogPosts] = await Promise.all([
      // Search products (top 5)
      searchProducts(searchQuery),
      // Search categories (top 3)
      searchCategories(searchQuery),
      // Search blog posts (top 2)
      searchBlogPosts(searchQuery),
    ])

    const response: SearchSuggestionsResponse = {
      products,
      categories,
      blogPosts,
    }

    const totalResults =
      products.length + categories.length + blogPosts.length

    return successResponse(response, {
      query: searchQuery,
      totalResults,
    })
  } catch (error) {
    logger.error('Search suggestions error', error)
    return handleApiError(error)
  }
}

/**
 * Search products by title, description, or category
 * Returns top 5 matches with essential fields for autocomplete display
 */
async function searchProducts(query: string): Promise<ProductSuggestion[]> {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
        { category: { contains: query } },
      ],
    },
    select: {
      id: true,
      title: true,
      price: true,
      salePrice: true,
      image: true,
      category: true,
    },
    take: 5,
    orderBy: [
      { featured: 'desc' }, // Prioritize featured products
      { createdAt: 'desc' },
    ],
  })

  return products.map((product) => ({
    id: product.id,
    title: product.title,
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    image: product.image,
    category: product.category,
    slug: product.id, // Using ID as slug for product URLs
  }))
}

/**
 * Search categories with product counts
 * Returns top 3 matching categories
 */
async function searchCategories(query: string): Promise<CategorySuggestion[]> {
  // Get distinct categories that match the query
  const categories = await prisma.product.groupBy({
    by: ['category'],
    where: {
      category: { contains: query },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 3,
  })

  return categories.map((cat) => ({
    name: cat.category,
    count: cat._count.id,
  }))
}

/**
 * Search blog posts by title or description
 * Returns top 2 matches with essential fields
 */
async function searchBlogPosts(query: string): Promise<BlogPostSuggestion[]> {
  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      publishedAt: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    take: 2,
    orderBy: [
      { featured: 'desc' }, // Prioritize featured posts
      { publishedAt: 'desc' },
    ],
  })

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    coverImage: post.coverImage,
    category: post.category?.name || null,
    publishedAt: post.publishedAt,
  }))
}
