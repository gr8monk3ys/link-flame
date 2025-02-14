import { NextResponse } from 'next/server'
import { BlogPost } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

// Mock data for development
const mockPosts: BlogPost[] = [
  {
    slug: 'welcome',
    title: 'Welcome to Our Blog',
    description: 'Learn about our latest updates and features',
    coverImage: '/images/blogs/default-hero.jpg',
    publishedAt: new Date().toISOString(),
    author: {
      name: 'Team Link Flame',
      image: '/images/team/default-avatar.jpg',
      role: 'Team'
    },
    content: '# Welcome\n\nThis is our first blog post.',
    category: 'Updates',
    tags: ['welcome', 'news'],
    featured: true,
    readingTime: '3 min read'
  },
  {
    slug: 'getting-started',
    title: 'Getting Started with Link Flame',
    description: 'A guide to using our platform effectively',
    coverImage: '/images/blogs/default-hero.jpg',
    publishedAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
    author: {
      name: 'Team Link Flame',
      image: '/images/team/default-avatar.jpg',
      role: 'Team'
    },
    content: '# Getting Started\n\nLearn how to use Link Flame.',
    category: 'Guides',
    tags: ['guide', 'tutorial'],
    featured: false,
    readingTime: '5 min read'
  }
]

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const post = mockPosts.find(p => p.slug === slug)
    
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(post), {
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
