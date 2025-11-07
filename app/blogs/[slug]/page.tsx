import { Metadata } from 'next'
import { PageProps } from '@/types/next'
import { getAllPosts, getPost } from '@/lib/blog'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import DOMPurify from 'isomorphic-dompurify'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map(post => ({
    slug: post.slug
  }))
}

export async function generateMetadata({
  params
}: PageProps<{ slug: string }>): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {}
  }

  return {
    title: post.title,
    description: post.description
  }
}

export default async function BlogPost({ params }: PageProps<{ slug: string }>) {
  const { slug } = await params
  const post = await getPost(slug)
  
  if (!post) {
    notFound()
  }

  const publishedAt = typeof post.publishedAt === 'string'
    ? post.publishedAt
    : post.publishedAt.toISOString()

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(post.content || '', {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
  })

  return (
    <article className="prose lg:prose-xl mx-auto px-4 py-8">
      <h1>{post.title}</h1>
      <div className="mb-8 flex items-center gap-4 text-gray-500">
        <time dateTime={publishedAt}>
          {format(typeof post.publishedAt === 'string' ? parseISO(post.publishedAt) : post.publishedAt, 'MMMM d, yyyy')}
        </time>
        <span>·</span>
        <span>{post.readingTime}</span>
      </div>
      <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    </article>
  )
}
