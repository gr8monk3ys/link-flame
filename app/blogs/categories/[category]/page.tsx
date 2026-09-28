import { getPostsByCategory, getAllPosts } from "@/lib/blog"
import { BlogCard } from "@/components/blog-card"
import { Metadata } from "next"

type Params = Promise<{ category: string }>

export async function generateStaticParams() {
  const posts = await getAllPosts()
  const categories = [...new Set(posts.map(post => post.category))]
  return categories.map(category => ({
    category
  }))
}

export async function generateMetadata({ 
  params 
}: { params: Params }): Promise<Metadata> {
  const category = decodeURIComponent((await params).category)
  
  return {
    title: `${category} Category`,
    description: `Browse articles in the ${category} category`
  }
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { category } = await params
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

      {posts.length > 0 ? (
        <div className="grid gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No articles found in this category. Browse other topics in the sidebar.
          </p>
        </div>
      )}
    </div>
  )
}
