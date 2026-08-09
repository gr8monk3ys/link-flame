import { Author, BlogPost } from '@/types/blog'
import { prisma } from './prisma'
import { transformPrismaPost } from './transformations/blog'
import { slugify } from './utils'

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

function extractPostsFromApiResponse(payload: unknown): BlogPost[] {
  if (Array.isArray(payload)) {
    return payload as BlogPost[]
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: unknown }).data
    if (Array.isArray(data)) {
      return data as BlogPost[]
    }
  }

  throw new Error('Unexpected blog posts response shape')
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
      const message = error instanceof Error ? error.message : 'Unknown database error';
      console.error(`Failed to fetch posts from database: ${message}`);
      return [];
    }
  }

  // In the browser, fetch from API
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/blog/posts`, { next: { revalidate: 3600 } })

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`)
  }

  const payload = (await response.json()) as unknown
  const posts = extractPostsFromApiResponse(payload)
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
      const message = error instanceof Error ? error.message : 'Unknown database error';
      console.error(`Failed to fetch post '${slug}' from database: ${message}`);
      return null;
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
  if (typeof window === 'undefined') {
    try {
      const posts = await prisma.blogPost.findMany({
        where: { featured: true },
        include: { author: true, category: true },
        orderBy: { publishedAt: 'desc' },
      })
      return posts.map(transformPrismaPost)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error'
      console.error(`Failed to fetch featured posts: ${message}`)
      return []
    }
  }
  const posts = await getAllPosts()
  return posts.filter(post => post.featured)
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  if (typeof window === 'undefined') {
    try {
      // Categories are stored as a display name only, so the URL segment is
      // always a derived form of it. Comparing slugified name to slugified
      // segment accepts every form the app links with - "Green Home",
      // "green home", "green-home" - which matters because the app really did
      // emit two of them: the post header linked "green home" (4 posts) while
      // the card linked "green-home" (0 posts, and still a 200).
      const wanted = slugify(category)
      const match = (await prisma.category.findMany({ select: { id: true, name: true } }))
        .find(candidate => slugify(candidate.name) === wanted)

      if (!match) return []

      const posts = await prisma.blogPost.findMany({
        where: { categoryId: match.id },
        include: { author: true, category: true },
        orderBy: { publishedAt: 'desc' },
      })
      return posts.map(transformPrismaPost)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error'
      console.error(`Failed to fetch posts for category '${category}': ${message}`)
      return []
    }
  }
  const posts = await getAllPosts()
  const wanted = slugify(category)
  return posts.filter(post =>
    post.category && slugify(post.category) === wanted
  ).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  if (typeof window === 'undefined') {
    try {
      const candidates = await prisma.blogPost.findMany({
        // Case-insensitive for the same reason as getPostsByCategory: tag links
        // lowercase the tag. The JS filter below already compares lowercased,
        // but a case-sensitive prefilter here returned no candidates for it to
        // examine, so the lowercasing was silently defeated at the database.
        where: { tags: { contains: tag, mode: 'insensitive' } },
        include: { author: true, category: true },
        orderBy: { publishedAt: 'desc' },
      })
      const lowerTag = tag.toLowerCase()
      return candidates
        .filter(post => {
          if (!post.tags) return false
          return post.tags.split(',').map(t => t.trim().toLowerCase()).includes(lowerTag)
        })
        .map(transformPrismaPost)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error'
      console.error(`Failed to fetch posts for tag '${tag}': ${message}`)
      return []
    }
  }
  const posts = await getAllPosts()
  return posts.filter(post =>
    post.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
  ).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export async function searchPosts(query: string): Promise<BlogPost[]> {
  if (typeof window === 'undefined') {
    try {
      const searchTerms = query.toLowerCase().split(' ').filter(Boolean)
      if (searchTerms.length === 0) return []
      const orConditions = searchTerms.flatMap(term => [
        { title: { contains: term } },
        { description: { contains: term } },
        { content: { contains: term } },
      ])
      const posts = await prisma.blogPost.findMany({
        where: { OR: orConditions },
        include: { author: true, category: true },
        orderBy: { publishedAt: 'desc' },
      })
      return posts.map(transformPrismaPost)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error'
      console.error(`Failed to search posts for '${query}': ${message}`)
      return []
    }
  }
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
