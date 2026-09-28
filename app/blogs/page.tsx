import Link from "next/link"
import { getAllPosts } from "@/lib/blog"
import { categoryHref } from "@/lib/blog-utils"
import { BlogCard } from "@/components/blog-card"
import { BlogSearch } from "@/components/blog-search"

export default async function BlogsPage() {
  const allPosts = await getAllPosts()
  const featuredPosts = allPosts.filter((post) => post.featured)
  // Only send the fields the client-side search needs (not full MDX bodies).
  const searchablePosts = allPosts.map(({ content, ...post }) => post)
  
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
        <BlogSearch posts={searchablePosts} />
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
              <Link
                href={categoryHref(category)}
                className="text-sm font-medium text-primary hover:underline"
              >
                View all<span className="sr-only"> {category} articles</span>
              </Link>
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
