'use server'

import matter from 'gray-matter'
import { BlogPost } from '@/lib/types'

let cachedPosts: BlogPost[] | null = null

// This is a mock implementation since we're running in Edge Runtime
// In a real app, you would fetch this data from a CMS or database
export async function getAllMDXPosts(): Promise<BlogPost[]> {
  if (cachedPosts) return cachedPosts

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  // Mock data for development
  cachedPosts = [
    {
      slug: 'welcome',
      title: 'Welcome to Our Blog',
      description: 'Learn about our latest updates and features',
      coverImage: '/images/blogs/default-hero.jpg',
      publishedAt: now.toISOString(),
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
      publishedAt: yesterday.toISOString(),
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

  return cachedPosts
}

export async function getMDXPost(slug: string): Promise<BlogPost | null> {
  const posts = await getAllMDXPosts()
  return posts.find(post => post.slug === slug) || null
}
