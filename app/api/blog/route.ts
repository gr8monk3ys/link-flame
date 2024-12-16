import { readFile, readdir } from 'node:fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { NextResponse } from 'next/server'

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

async function getMDXPost(slug: string) {
  const postsDirectory = path.join(process.cwd(), 'content/blogs')
  const fullPath = path.join(postsDirectory, `${slug}.mdx`)
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
    content
  }
}

async function getAllMDXPosts() {
  const postsDirectory = path.join(process.cwd(), 'content/blogs')
  const filenames = await readdir(postsDirectory)
  const posts = await Promise.all(
    filenames
      .filter(filename => filename.endsWith('.mdx'))
      .map(async filename => {
        const slug = filename.replace(/\.mdx$/, '')
        const post = await getMDXPost(slug)
        return post
      })
  )
  
  return posts.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}
