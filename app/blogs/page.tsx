import { getAllPosts, getFeaturedPosts } from "@/lib/blog"
import { BlogCard } from "@/components/blogs/blog-card"
import { BlogSearch } from "@/components/blogs/blog-search"

export default async function BlogsPage() {
  const [featuredPosts, allPosts] = await Promise.all([
    getFeaturedPosts(),
    getAllPosts()
  ])

  // Get unique categories
  const categories = Array.from(new Set(allPosts.map(post => post.category).filter((cat): cat is string => cat !== undefined)))

  // Get unique tags
  const allTags = allPosts.flatMap(post => post.tags || [])
  const tags = Array.from(new Set(allTags)).sort()

  return (
    <div className="container py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Eco-Living Blog
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Discover sustainable living tips, product reviews, and expert advice to help
          you make eco-conscious choices.
        </p>
      </div>

      {/* Search Section */}
      <div className="my-8">
        <BlogSearch categories={categories} tags={tags} />
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="my-12">
          <h2 className="mb-6 text-2xl font-bold">Featured Articles</h2>
          <div className="grid gap-6">
            {featuredPosts.map((post) => (
              <BlogCard key={post.slug} post={post} featured />
            ))}
          </div>
        </section>
      )}

      {/* Posts by Category */}
      {categories.map((category) => {
        if (!category) return null;
        const categoryPosts = allPosts.filter(post => post.category === category)
        return (
          <section key={category} className="my-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{category}</h2>
              <a
                href={`/blogs/${category.toLowerCase()}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                View All
              </a>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categoryPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
