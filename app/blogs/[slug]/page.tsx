import { Metadata } from 'next'
import { PageProps } from '@/types/next'
import { getAllPosts, getPost } from '@/lib/blog'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map(post => ({
    slug: post.slug
  }))
}

export async function generateMetadata({ 
  params 
}: { params: PageProps['params'] }): Promise<Metadata> {
  const post = await getPost(params.slug)
  
  if (!post) {
    return {}
  }

  return {
    title: post.title,
    description: post.description
  }
}

export default async function BlogPost({ params }: { params: PageProps['params'] }) {
  const post = await getPost(params.slug)
  
  if (!post) {
    notFound()
  }

  return (
    <article className="prose lg:prose-xl mx-auto px-4 py-8">
      <h1>{post.title}</h1>
      <div className="mb-8 flex items-center gap-4 text-gray-500">
        <time dateTime={post.publishedAt.toISOString()}>
          {post.publishedAt.toLocaleDateString()}
        </time>
        <span>·</span>
        <span>{post.readingTime}</span>
      </div>
      <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
    </article>
  )
}
