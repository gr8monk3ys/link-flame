import { Author, BlogPost } from './types'

export type { BlogPost, Author }

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

// Mock data for development and build time
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

// Helper functions
export async function getAllPosts(): Promise<BlogPost[]> {
  // During build or when running in Node.js, return mock data
  if (typeof window === 'undefined') {
    return mockPosts.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
  }

  // In the browser, fetch from API
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/blog/posts`, { next: { revalidate: 3600 } })
  const posts = await response.json()
  return posts.sort((a: BlogPost, b: BlogPost) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  // During build or when running in Node.js, return mock data
  if (typeof window === 'undefined') {
    return mockPosts.find(post => post.slug === slug) || null
  }

  // In the browser, fetch from API
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/blog/post/${slug}`, { next: { revalidate: 3600 } })
  if (!response.ok) {
    throw new Error(`Failed to fetch post: ${slug}`)
  }
  return response.json()
}

export async function getFeaturedPosts(): Promise<BlogPost[]> {
  const posts = await getAllPosts()
  return posts.filter(post => post.featured)
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getAllPosts()
  return posts.filter(post => 
    post.category.toLowerCase() === category.toLowerCase()
  ).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getAllPosts()
  return posts.filter(post => 
    post.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
  ).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export async function searchPosts(query: string): Promise<BlogPost[]> {
  const posts = await getAllPosts()
  const searchTerms = query.toLowerCase().split(' ')
  
  return posts.filter(post => 
    searchTerms.some(term => 
      post.title.toLowerCase().includes(term) ||
      post.description.toLowerCase().includes(term) ||
      post.content?.toLowerCase().includes(term)
    )
  ).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}
