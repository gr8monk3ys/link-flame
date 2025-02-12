'use server'

import matter from 'gray-matter'

let cachedPosts: any[] | null = null

// This is a mock implementation since we're running in Edge Runtime
// In a real app, you would fetch this data from a CMS or database
export async function getAllMDXPosts() {
  if (cachedPosts) return cachedPosts

  // Mock data for development
  cachedPosts = [
    {
      slug: 'welcome',
      title: 'Welcome to Our Blog',
      description: 'Learn about our latest updates and features',
      coverImage: '/images/blogs/default-hero.jpg',
      publishedAt: '2025-02-12T00:00:00.000Z',
      author: 'Team Link Flame',
      content: '# Welcome\n\nThis is our first blog post.',
    },
    {
      slug: 'getting-started',
      title: 'Getting Started with Link Flame',
      description: 'A guide to using our platform effectively',
      coverImage: '/images/blogs/default-hero.jpg',
      publishedAt: '2025-02-11T00:00:00.000Z',
      author: 'Team Link Flame',
      content: '# Getting Started\n\nLearn how to use Link Flame.',
    },
  ]
  
  return cachedPosts
}

export async function getMDXPost(slug: string) {
  const posts = await getAllMDXPosts()
  const post = posts.find(p => p.slug === slug)
  
  if (!post) {
    console.error(`Post not found: ${slug}`)
    return null
  }
  
  return post
}
