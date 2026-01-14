import { prisma } from '@/lib/prisma'
import { handleApiError, successResponse } from '@/lib/api-response'
import { transformPrismaPost } from '@/lib/transformations/blog'
import { logger } from '@/lib/logger'

// Cache blog posts for 1 hour (3600 seconds) for better performance
// Remove this line if you need real-time updates
export const revalidate = 3600

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      include: {
        author: true,
        category: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    })

    return successResponse(posts.map(transformPrismaPost))
  } catch (error) {
    logger.error('Failed to fetch blog posts', error)
    return handleApiError(error)
  }
}
