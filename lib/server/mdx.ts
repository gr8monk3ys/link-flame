import { readFile, readdir } from 'node:fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { cache } from 'react'

// Cache the MDX posts retrieval
export const getAllMDXPosts = cache(async () => {
  const postsDirectory = path.join(process.cwd(), 'content/blogs')
  const fileNames = await readdir(postsDirectory)
  
  const posts = await Promise.all(
    fileNames
      .filter(fileName => fileName.endsWith('.mdx'))
      .map(async (fileName) => {
        const slug = fileName.replace(/\.mdx$/, '')
        return getMDXPost(slug)
      })
  )

  // Sort posts by date, most recent first
  return posts.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
})

// Cache the single post retrieval
export const getMDXPost = cache(async (slug: string) => {
  const postsDirectory = path.join(process.cwd(), 'content/blogs')
  const fullPath = path.join(postsDirectory, `${slug}.mdx`)
  
  try {
    const fileContents = await readFile(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    
    return {
      slug,
      title: data.title,
      description: data.description || '',
      coverImage: data.coverImage || '/images/blogs/default-hero.jpg',
      publishedAt: new Date(data.date),
      content,
      ...data,
    }
  } catch (error) {
    console.error(`Error reading MDX file ${slug}:`, error)
    throw new Error(`Failed to get post: ${slug}`)
  }
})
