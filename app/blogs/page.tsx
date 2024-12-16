import { getAllPosts, getFeaturedPosts } from "@/lib/blog"
import { BlogCard } from "@/components/blog-card"
import { BlogSearch } from "@/components/blog-search"

export default function BlogsPage() {
  const featuredPosts = getFeaturedPosts()
  const allPosts = getAllPosts()
  
  // Get unique categories
  const categories = Array.from(new Set(allPosts.map(post => post.category)))

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
        <BlogSearch />
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
        const categoryPosts = allPosts.filter(post => post.category === category)
        return (
          <section key={category} className="my-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{category}</h2>
              <a
                href={`/blogs/${category.toLowerCase()}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </a>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categoryPosts.slice(0, 3).map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        )
      })}

      {/* Newsletter */}
      <section className="my-12">
        <div className="rounded-lg border bg-card p-8 text-card-foreground">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-2xl font-bold">Stay Updated</h2>
            <p className="max-w-[600px] text-muted-foreground">
              Subscribe to our newsletter for the latest sustainable living tips,
              eco-friendly product recommendations, and exclusive deals.
            </p>
            <form className="flex w-full max-w-sm gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
