/**
 * Shared blog post transformation utilities
 * Used by both lib/blog.ts and app/api/blog/posts/route.ts
 */

import { BlogPost } from '@/types/blog'
import { Prisma } from '@prisma/client'

// Type for Prisma BlogPost with included relations
export type PrismaPostWithRelations = Prisma.BlogPostGetPayload<{
  include: {
    author: true;
    category: true;
  }
}>

/**
 * Transform a Prisma BlogPost record to the BlogPost type used by the frontend
 */
export function transformPrismaPost(prismaPost: PrismaPostWithRelations): BlogPost {
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
      name: prismaPost.author.name || 'Unknown Author',
      image: prismaPost.author.image || '/images/team/default-avatar.jpg',
      role: prismaPost.author.role || 'Contributor',
    },
    authorId: prismaPost.authorId,
    category: prismaPost.category?.name || 'Uncategorized',
    categoryId: prismaPost.categoryId ?? undefined,
    tags: prismaPost.tags ? prismaPost.tags.split(',').map((t: string) => t.trim()) : [],
    featured: prismaPost.featured || false,
    readingTime: prismaPost.readingTime || undefined,
    // BlogPost model doesn't have createdAt/updatedAt - use publishedAt as fallback
    createdAt: prismaPost.publishedAt.toISOString(),
    updatedAt: prismaPost.publishedAt.toISOString(),
  };
}
