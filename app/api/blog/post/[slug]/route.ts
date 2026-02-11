import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BlogPost } from '@/types'
import { handleApiError, notFoundResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// Cache individual blog posts for 1 hour (3600 seconds) for better performance
// Remove this line if you need real-time updates
export const revalidate = 3600

// Type for Prisma BlogPost with included relations (matching the actual query result)
interface PrismaPostWithRelations {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  coverImage: string | null;
  publishedAt: Date;
  authorId: string;
  categoryId: string | null;
  tags: string | null;
  featured: boolean;
  readingTime: string | null;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    role: string | null;
  };
  category: {
    id: string;
    name: string;
  } | null;
}

// Helper to transform Prisma BlogPost to BlogPost type
function transformPrismaPost(prismaPost: PrismaPostWithRelations): BlogPost {
  return {
    id: prismaPost.id,
    slug: prismaPost.slug,
    title: prismaPost.title,
    description: prismaPost.description ?? '',
    content: prismaPost.content ?? undefined,
    coverImage: prismaPost.coverImage ?? '/images/blogs/default-hero.jpg',
    publishedAt: prismaPost.publishedAt.toISOString(),
    author: {
      id: prismaPost.author.id,
      name: prismaPost.author.name ?? 'Anonymous',
      image: prismaPost.author.image ?? '/images/team/default-avatar.jpg',
      role: prismaPost.author.role ?? 'Contributor',
    },
    authorId: prismaPost.authorId,
    category: prismaPost.category?.name ?? 'Uncategorized',
    categoryId: prismaPost.categoryId ?? undefined,
    tags: prismaPost.tags ? prismaPost.tags.split(',').map((t: string) => t.trim()) : [],
    featured: prismaPost.featured,
    readingTime: prismaPost.readingTime ?? undefined,
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
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!post) {
      return notFoundResponse("Post")
    }

    return NextResponse.json(transformPrismaPost(post as PrismaPostWithRelations))
  } catch (error) {
    logger.error('Failed to fetch post', error)
    return handleApiError(error)
  }
}
