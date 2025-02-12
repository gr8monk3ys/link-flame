import { NextResponse } from 'next/server'
import { getAllMDXPosts } from '../utils'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
  try {
    const posts = await getAllMDXPosts()
    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
