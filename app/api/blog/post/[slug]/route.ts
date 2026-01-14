import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BlogPost } from '@/types'
import { handleApiError, notFoundResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

// Cache individual blog posts for 1 hour (3600 seconds) for better performance
// Remove this line if you need real-time updates
export const revalidate = 3600

// Helper to transform Prisma BlogPost to BlogPost type
function transformPrismaPost(prismaPost: any): BlogPost {
  return {
    id: prismaPost.id,
    slug: prismaPost.slug,
    title: prismaPost.title,
    description: prismaPost.description || '',
    content: prismaPost.content || undefined,
    coverImage: prismaPost.coverImage || '/images/blogs/default-hero.jpg',
    publishedAt: prismaPost.publishedAt.toISOString(),
    author: {
      id: prismaPost.author.id,
      name: prismaPost.author.name,
      image: prismaPost.author.image || '/images/team/default-avatar.jpg',
      role: prismaPost.author.role || 'Contributor',
    },
    authorId: prismaPost.authorId,
    category: prismaPost.category?.name || 'Uncategorized',
    categoryId: prismaPost.categoryId,
    tags: prismaPost.tags ? prismaPost.tags.split(',').map((t: string) => t.trim()) : [],
    featured: prismaPost.featured || false,
    readingTime: prismaPost.readingTime || undefined,
    createdAt: prismaPost.createdAt?.toISOString(),
    updatedAt: prismaPost.updatedAt?.toISOString(),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: true,
        category: true,
      },
    });

    if (!post) {
      return notFoundResponse("Post")
    }

    return NextResponse.json(transformPrismaPost(post))
  } catch (error) {
    logger.error('Failed to fetch post', error)
    return handleApiError(error)
  }
}
