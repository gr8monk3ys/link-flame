import { getPostsByCategory, getAllPosts } from "@/lib/blog"
import { BlogCard } from "@/components/blog-card"
import { TagCloud } from "@/components/tag-cloud"
import { NewsletterSignup } from "@/components/newsletter-signup"

interface CategoryPageProps {
  params: {
    category: string
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = params
  const decodedCategory = decodeURIComponent(category)
  const posts = await getPostsByCategory(decodedCategory)

  return (
    <div className="container py-10">
      <div className="mb-8 flex max-w-[980px] flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
            {decodedCategory}
          </h1>
          <span className="text-lg text-muted-foreground">
            ({posts.length} {posts.length === 1 ? "article" : "articles"})
          </span>
        </div>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Browse our collection of articles about {decodedCategory}.
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
                No articles found in this category. Check out our other topics below.
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

// Generate static params for all categories
export async function generateStaticParams() {
  const posts = await getAllPosts()
  const categories = new Set(posts.map(post => post.category))
  return Array.from(categories).map(category => ({
    category: encodeURIComponent(category.toLowerCase())
  }))
}