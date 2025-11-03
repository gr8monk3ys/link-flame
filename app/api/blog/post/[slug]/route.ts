import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BlogPost } from '@/types'

export const dynamic = 'force-dynamic'
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
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(transformPrismaPost(post)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
