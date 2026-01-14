import { Author, BlogPost } from './types'
import { prisma } from './prisma'
import { transformPrismaPost } from './transformations/blog'

export type { BlogPost, Author }

// Result type for functions that can fail
export type BlogResult<T> =
  | { success: true; data: T }
  | { success: false; data: null; error: Error }

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

// Helper functions
export async function getAllPosts(): Promise<BlogPost[]> {
  // During build or when running in Node.js, fetch from database
  if (typeof window === 'undefined') {
    try {
      const posts = await prisma.blogPost.findMany({
        include: {
          author: true,
          category: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });
      return posts.map(transformPrismaPost);
    } catch (error) {
      // Throw error instead of silently returning empty array
      // This allows callers to distinguish "no posts" from "error"
      const message = error instanceof Error ? error.message : 'Unknown database error';
      throw new Error(`Failed to fetch posts from database: ${message}`);
    }
  }

  // In the browser, fetch from API
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/blog/posts`, { next: { revalidate: 3600 } })

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`)
  }

  const posts = await response.json() as BlogPost[]
  return posts.sort((a: BlogPost, b: BlogPost) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  // During build or when running in Node.js, fetch from database
  if (typeof window === 'undefined') {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { slug },
        include: {
          author: true,
          category: true,
        },
      });
      return post ? transformPrismaPost(post) : null;
    } catch (error) {
      // Throw error instead of silently returning null
      // This allows callers to distinguish "post not found" from "error"
      const message = error instanceof Error ? error.message : 'Unknown database error';
      throw new Error(`Failed to fetch post '${slug}' from database: ${message}`);
    }
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
    post.category && post.category.toLowerCase() === category.toLowerCase()
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
