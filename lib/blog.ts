import path from 'path'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

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

// Function to read MDX files
export async function getMDXPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/blog?slug=${encodeURIComponent(slug)}`)
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch blog post')
    }
    const post = await response.json()
    return {
      ...post,
      publishedAt: new Date(post.publishedAt)
    }
  } catch (error) {
    console.error(`Error fetching MDX post for slug ${slug}:`, error)
    return null
  }
}

// Function to get all MDX posts
export async function getAllMDXPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/blog`)
    if (!response.ok) {
      throw new Error('Failed to fetch blog posts')
    }
    const posts = await response.json()
    return posts.map((post: any) => ({
      ...post,
      publishedAt: new Date(post.publishedAt)
    }))
  } catch (error) {
    console.error('Error fetching MDX posts:', error)
    return []
  }
}

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
  const searchTerms = query.toLowerCase().split(" ")
  return posts.filter(post => {
    const searchableText = `
      ${post.title} 
      ${post.description} 
      ${post.category} 
      ${post.tags.join(" ")}
    `.toLowerCase()
    
    return searchTerms.every(term => searchableText.includes(term))
  }).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}
