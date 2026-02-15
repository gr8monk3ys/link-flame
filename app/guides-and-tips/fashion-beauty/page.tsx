import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { NewsletterSignup } from "@/components/shared/newsletter-signup"

export default function FashionBeautyPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Eco-Friendly Fashion & Beauty
        </h1>
        <p className="text-xl text-muted-foreground">
          Discover sustainable fashion and clean beauty products that are good for you and the planet
        </p>
      </div>

      <div className="space-y-10">
        {/* Featured Categories */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Popular Categories</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="p-6 text-center transition-shadow hover:shadow-lg">
              <h3 className="mb-2 font-bold">Sustainable Fashion</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Eco-friendly clothing and accessories
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/guides-and-tips/fashion-beauty/sustainable-fashion">Explore</Link>
              </Button>
            </Card>

            <Card className="p-6 text-center transition-shadow hover:shadow-lg">
              <h3 className="mb-2 font-bold">Clean Beauty</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Natural and organic beauty products
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/guides-and-tips/fashion-beauty/clean-beauty">Explore</Link>
              </Button>
            </Card>

            <Card className="p-6 text-center transition-shadow hover:shadow-lg">
              <h3 className="mb-2 font-bold">Ethical Jewelry</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Sustainably sourced accessories
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/guides-and-tips/fashion-beauty/ethical-jewelry">Explore</Link>
              </Button>
            </Card>
          </div>
        </section>

        {/* Featured Content */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Featured Guides</h2>
          <div className="grid gap-6">
            <Card className="p-6">
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="md:w-2/3">
                  <h3 className="mb-2 text-xl font-bold">
                    Building a Sustainable Wardrobe
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    Learn how to create a capsule wardrobe with eco-friendly pieces that last
                  </p>
                  <Button asChild>
                    <Link href="/guides-and-tips/fashion-beauty/sustainable-wardrobe">Read Guide</Link>
                  </Button>
                </div>
                <div className="rounded-lg bg-muted md:w-1/3"></div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="md:w-2/3">
                  <h3 className="mb-2 text-xl font-bold">
                    Natural Skincare Essentials
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    Discover clean beauty products that are good for your skin and the environment
                  </p>
                  <Button asChild>
                    <Link href="/guides-and-tips/fashion-beauty/natural-skincare">Read Guide</Link>
                  </Button>
                </div>
                <div className="rounded-lg bg-muted md:w-1/3"></div>
              </div>
            </Card>
          </div>
        </section>

        {/* Tips Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Quick Tips</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 font-bold">Sustainable Fashion Tips</h3>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <svg
                    className="size-6 shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Choose quality over quantity</span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg
                    className="size-6 shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Support ethical brands</span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg
                    className="size-6 shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Consider second-hand options</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-bold">Clean Beauty Tips</h3>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <svg
                    className="size-6 shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Read ingredient labels carefully</span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg
                    className="size-6 shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Look for plastic-free packaging</span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg
                    className="size-6 shrink-0 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Choose cruelty-free products</span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Newsletter Section */}
        <NewsletterSignup
          title="Stay Updated"
          description="Get the latest sustainable fashion and clean beauty tips delivered to your inbox."
        />
      </div>
    </div>
  )
}
