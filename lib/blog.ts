import { Author, BlogPost } from './types'

// Helper functions
export async function getAllPosts(): Promise<BlogPost[]> {
  const response = await fetch('/api/blog/posts')
  const posts = await response.json()
  return posts.sort((a: BlogPost, b: BlogPost) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export async function getPost(slug: string): Promise<BlogPost> {
  const response = await fetch(`/api/blog/post/${slug}`)
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
