import { getPostsByTag, getAllPosts } from "@/lib/blog"
import { BlogCard } from "@/components/blog-card"
import { TagCloud } from "@/components/tag-cloud"
import { NewsletterSignup } from "@/components/newsletter-signup"

interface TagPageProps {
  params: {
    tag: string
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = params
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

// Generate static params for all tags
export async function generateStaticParams() {
  const posts = await getAllPosts()
  const tags = new Set(posts.flatMap(post => post.tags))
  return Array.from(tags).map(tag => ({
    tag: encodeURIComponent(tag.toLowerCase())
  }))
}
