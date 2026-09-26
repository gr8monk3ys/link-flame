import Link from "next/link"
import { NewsletterSignup } from "@/components/shared/newsletter-signup"
import { TagCloud } from "@/components/blogs/tag-cloud"
import { prisma } from "@/lib/prisma"

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container">
      <div className="flex flex-col gap-10 lg:flex-row">
        {/* Main Content */}
        <div className="flex-1">{children}</div>

        {/* Sidebar */}
        <aside className="w-full space-y-6 lg:w-[300px]">
          <NewsletterSignup
            title="Get Eco Tips"
            description="Join our community and receive weekly sustainable living tips and exclusive deals."
          />
          
          {/* Tag Cloud */}
          <TagCloud />

          {/* Popular Categories */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="mb-4 text-base font-semibold">Popular Categories</h2>
              <ul className="space-y-2">
                <li>
                  <a href="/blogs/categories/green-home" className="text-muted-foreground hover:text-primary">
                    Green Home & Garden
                  </a>
                </li>
                <li>
                  <a href="/blogs/categories/eco-fashion" className="text-muted-foreground hover:text-primary">
                    Eco Fashion & Beauty
                  </a>
                </li>
                <li>
                  <a href="/blogs/categories/zero-waste" className="text-muted-foreground hover:text-primary">
                    Zero Waste Living
                  </a>
                </li>
                <li>
                  <a href="/blogs/categories/sustainable-travel" className="text-muted-foreground hover:text-primary">
                    Sustainable Travel
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Featured Products: its own async component, so the layout (and
              the TagCloud query) no longer wait on this query first
              (react-best-practices 3.7). */}
          <FeaturedProducts />
        </aside>
      </div>
    </div>
  )
}

async function FeaturedProducts() {
  // Real products from the shelf - this sidebar used to advertise three
  // hardcoded products the store has never stocked, all linking to "#".
  const featuredProducts = await prisma.product
    .findMany({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, subtitle: true, category: true },
    })
    .catch(() => [])

  return (
    <>
      {featuredProducts.length > 0 && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h2 className="mb-4 text-base font-semibold">From the Shop</h2>
            <ul className="space-y-4">
              {featuredProducts.map((product) => (
                <li key={product.id}>
                  <Link href={`/products/${product.id}`} className="block hover:opacity-80">
                    <div className="font-medium">{product.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.subtitle ?? product.category}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
