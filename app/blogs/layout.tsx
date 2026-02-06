import { NewsletterSignup } from "@/components/shared/newsletter-signup"
import { TagCloud } from "@/components/blogs/tag-cloud"

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container">
      <div className="flex flex-col gap-10 lg:flex-row">
        {/* Main Content */}
        <main className="flex-1">{children}</main>

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
              <h3 className="mb-4 font-semibold">Popular Categories</h3>
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

          {/* Featured Products */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="mb-4 font-semibold">Featured Products</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="block hover:opacity-80">
                    <div className="font-medium">Bamboo Cutlery Set</div>
                    <div className="text-sm text-muted-foreground">Perfect for zero-waste living</div>
                  </a>
                </li>
                <li>
                  <a href="#" className="block hover:opacity-80">
                    <div className="font-medium">Organic Cotton Tote</div>
                    <div className="text-sm text-muted-foreground">Sustainable shopping companion</div>
                  </a>
                </li>
                <li>
                  <a href="#" className="block hover:opacity-80">
                    <div className="font-medium">Solar Power Bank</div>
                    <div className="text-sm text-muted-foreground">Eco-friendly charging solution</div>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
