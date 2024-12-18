import { readFile, readdir } from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { NextResponse } from 'next/server'
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
      author: data.author || {
        name: "Link Flame Team",
        image: "/images/team/default.jpg",
        bio: "Passionate about sustainability and eco-friendly living."
      },
      category: data.category || 'General',
      tags: data.tags || ['Sustainability'],
      readingTime: `${Math.ceil(content.split(' ').length / 200)} min read`,
      content,
      featured: data.featured || false
    }
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error)
    return null
  }
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  try {
    if (slug) {
      // Get single post
      const post = await getMDXPost(slug)
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json(post)
    } else {
      // Get all posts
      const posts = await getAllMDXPosts()
      return NextResponse.json(posts)
    }
  } catch (error) {
    console.error('Blog API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Revalidate every hour
export const revalidate = 3600
