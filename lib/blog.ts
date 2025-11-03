import { Author, BlogPost } from './types'
import { prisma } from './prisma'

export type { BlogPost, Author }

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

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
      console.error('Failed to fetch posts from database:', error);
      return [];
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
      console.error(`Failed to fetch post ${slug} from database:`, error);
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
