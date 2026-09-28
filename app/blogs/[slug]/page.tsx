import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getMDXPost, getAllMDXPosts } from "@/lib/blog"
import { MdxContent } from "@/components/mdx-content"

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
    <article className="mx-auto max-w-3xl py-8">
      <h1 className="text-balance text-4xl font-bold tracking-tight lg:text-5xl">
        {post.title}
      </h1>
      <div className="mb-8 mt-4 flex items-center gap-4 text-muted-foreground">
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
      {post.content ? <MdxContent source={post.content} /> : null}
    </article>
  )
}
