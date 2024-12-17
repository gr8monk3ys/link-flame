import { MDXRemote } from 'next-mdx-remote/rsc'
import { getMDXPost, getAllMDXPosts } from '@/lib/blog'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const posts = await getAllMDXPosts()
  return posts.map(post => ({
    slug: post.slug
  }))
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getMDXPost(params.slug)
  
  if (!post) {
    notFound()
  }

  return (
    <article className="prose lg:prose-xl mx-auto py-8 px-4">
      <h1>{post.title}</h1>
      <div className="flex items-center gap-4 text-gray-500 mb-8">
        <time dateTime={post.publishedAt.toISOString()}>
          {post.publishedAt.toLocaleDateString()}
        </time>
        <span>•</span>
        <span>{post.readingTime}</span>
      </div>
      {/* {post.content && <MDXRemote source={post.content} />} */}
    </article>
  )
}
