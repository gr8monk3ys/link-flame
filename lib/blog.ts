import { getAllMDXPosts, getMDXPost } from '@/app/api/blog/route'

export interface Author {
  name: string
  image: string
  bio: string
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  coverImage: string
  publishedAt: Date
  author: Author
  category: string
  tags: string[]
  readingTime: string
  featured?: boolean
  content?: string
}

// Re-export the functions from the route
export { getAllMDXPosts, getMDXPost }

// Additional helper functions
export async function getAllPosts(): Promise<BlogPost[]> {
  const posts = await getAllMDXPosts()
  return posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}

export async function getFeaturedPosts(): Promise<BlogPost[]> {
  const posts = await getAllMDXPosts()
  return posts.filter(post => post.featured)
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getAllMDXPosts()
  return posts.filter(post => 
    post.category.toLowerCase() === category.toLowerCase()
  ).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getAllMDXPosts()
  return posts.filter(post => 
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  ).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}

export async function searchPosts(query: string): Promise<BlogPost[]> {
  const posts = await getAllMDXPosts()
  const lowercaseQuery = query.toLowerCase()
  return posts.filter(post => 
    post.title.toLowerCase().includes(lowercaseQuery) ||
    post.description.toLowerCase().includes(lowercaseQuery) ||
    post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    post.category.toLowerCase().includes(lowercaseQuery)
  ).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}
