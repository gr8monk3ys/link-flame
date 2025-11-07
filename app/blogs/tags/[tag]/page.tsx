import { getPostsByTag, getAllPosts } from "@/lib/blog"
import { BlogCard } from "@/components/blogs/blog-card"
import { NewsletterSignup } from "@/components/shared/newsletter-signup"
import { TagCloud } from "@/components/blogs/tag-cloud"
import { PageProps } from "@/types/next"
import { Metadata } from "next"

export async function generateStaticParams() {
  const posts = await getAllPosts()
  const tags = [...new Set(posts.flatMap(post => post.tags))]
  return tags.map(tag => ({
    tag: encodeURIComponent(tag)
  }))
}

export async function generateMetadata({
  params
}: PageProps<{ tag: string }>): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)

  return {
    title: `#${decodedTag} Tag`,
    description: `Browse articles tagged with ${decodedTag}`
  }
}

export default async function TagPage({ params }: PageProps<{ tag: string }>) {
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

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main Content */}
        <div className="flex-1">
          {posts.length > 0 ? (
            <div className="grid gap-6">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No articles found for this tag. Check out our other topics below.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[300px]">
          <div className="sticky top-8 space-y-8">
            <TagCloud />
            <NewsletterSignup />
          </div>
        </div>
      </div>
    </div>
  )
}
