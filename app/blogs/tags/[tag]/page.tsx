import { getPostsByTag, getAllPosts } from "@/lib/blog"
import { BlogCard } from "@/components/blog-card"
import { Metadata } from "next"

type Params = Promise<{ tag: string }>

export async function generateStaticParams() {
  const posts = await getAllPosts()
  const tags = [...new Set(posts.flatMap(post => post.tags))]
  return tags.map(tag => ({
    tag
  }))
}

export async function generateMetadata({ 
  params 
}: { params: Params }): Promise<Metadata> {
  const tag = decodeURIComponent((await params).tag)
  
  return {
    title: `#${tag} Tag`,
    description: `Browse articles tagged with ${tag}`
  }
}

export default async function TagPage({ params }: { params: Params }) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  const posts = await getPostsByTag(decodedTag)

  return (
    <div className="container py-10">
      <div className="mb-8 flex max-w-[980px] flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
            #{decodedTag}
          </h1>
          <span className="text-lg text-muted-foreground">
            ({posts.length} {posts.length === 1 ? "article" : "articles"})
          </span>
        </div>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Browse our collection of articles about {decodedTag}.
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="grid gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No articles found for this tag. Browse other topics in the sidebar.
          </p>
        </div>
      )}
    </div>
  )
}
