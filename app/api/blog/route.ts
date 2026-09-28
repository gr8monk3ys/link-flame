import { NextResponse } from 'next/server'
import { getAllMDXPosts, getMDXPost } from '@/lib/blog'

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
