import Link from "next/link"
import { NewsletterSignup } from "@/components/newsletter-signup"
import { TagCloud } from "@/components/tag-cloud"
import { categoryHref } from "@/lib/blog-utils"

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container">
      <div className="flex flex-col gap-10 lg:flex-row">
        {/* Main Content */}
        <div className="min-w-0 flex-1">{children}</div>

        {/* Sidebar */}
        <aside aria-label="Blog sidebar" className="w-full space-y-6 lg:w-[300px]">
          <NewsletterSignup
            title="Get Eco Tips"
            description="Join our community and receive weekly sustainable living tips and exclusive deals."
          />
          
          {/* Tag Cloud */}
          <TagCloud />

          {/* Popular Categories */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="mb-4 font-semibold">Popular Categories</h2>
              <ul className="space-y-2">
                <li>
                  <Link href={categoryHref("Green Home")} className="text-muted-foreground hover:text-primary">
                    Green Home & Garden
                  </Link>
                </li>
                <li>
                  <Link href={categoryHref("Fashion & Beauty")} className="text-muted-foreground hover:text-primary">
                    Eco Fashion & Beauty
                  </Link>
                </li>
                <li>
                  <Link href={categoryHref("Zero Waste")} className="text-muted-foreground hover:text-primary">
                    Zero Waste Living
                  </Link>
                </li>
                <li>
                  <Link href={categoryHref("Sustainable Travel")} className="text-muted-foreground hover:text-primary">
                    Sustainable Travel
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Featured Products */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h2 className="mb-4 font-semibold">Featured Products</h2>
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
