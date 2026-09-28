import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getMDXPost, getAllMDXPosts } from "@/lib/blog"

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const posts = await getAllMDXPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getMDXPost(slug)

  if (!post) {
    return {}
  }

  return {
    title: post.title,
    description: post.description,
  }
}

export default async function BlogPost({ params }: { params: Params }) {
  const { slug } = await params
  const post = await getMDXPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="prose mx-auto px-4 py-8 dark:prose-invert lg:prose-xl">
      <h1>{post.title}</h1>
      <div className="mb-8 flex items-center gap-4 text-muted-foreground">
        <time dateTime={post.publishedAt.toISOString()}>
          {post.publishedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <span aria-hidden="true">•</span>
        <span>{post.readingTime}</span>
      </div>
      {/* {post.content && <MDXRemote source={post.content} />} */}
    </article>
  )
}
