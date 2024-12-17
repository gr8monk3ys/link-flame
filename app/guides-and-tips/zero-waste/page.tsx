import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ZeroWastePage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Zero Waste Living
        </h1>
        <p className="text-xl text-muted-foreground">
          Practical tips and guides to help you reduce waste and live more sustainably
        </p>
      </div>

      <div className="space-y-10">
        {/* Getting Started Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Getting Started</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <h3 className="mb-4 font-bold">Step 1: Assess</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Track your waste for a week to identify areas for improvement
              </p>
              <Button variant="outline" className="w-full">
                Learn More
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-bold">Step 2: Replace</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Switch to reusable alternatives for common disposable items
              </p>
              <Button variant="outline" className="w-full">
                View Guide
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-bold">Step 3: Maintain</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Develop sustainable habits and routines
              </p>
              <Button variant="outline" className="w-full">
                Get Tips
              </Button>
            </Card>
          </div>
        </section>

        {/* Key Areas Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Key Areas to Reduce Waste</h2>
          <div className="grid gap-6">
            <Card className="p-6">
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="md:w-2/3">
                  <h3 className="mb-2 text-xl font-bold">Kitchen & Food</h3>
                  <ul className="mb-4 space-y-2">
                    <li className="flex items-start space-x-2">
                      <svg
                        className="h-6 w-6 shrink-0 text-green-500"
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
                      <span>Meal planning to reduce food waste</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg
                        className="h-6 w-6 shrink-0 text-green-500"
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
                      <span>Reusable containers and bags</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg
                        className="h-6 w-6 shrink-0 text-green-500"
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
                      <span>Composting basics</span>
                    </li>
                  </ul>
                  <Button>Explore Kitchen Tips</Button>
                </div>
                <div className="rounded-lg bg-muted md:w-1/3"></div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="md:w-2/3">
                  <h3 className="mb-2 text-xl font-bold">Bathroom & Personal Care</h3>
                  <ul className="mb-4 space-y-2">
                    <li className="flex items-start space-x-2">
                      <svg
                        className="h-6 w-6 shrink-0 text-green-500"
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
                      <span>Plastic-free toiletries</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg
                        className="h-6 w-6 shrink-0 text-green-500"
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
                      <span>DIY beauty products</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg
                        className="h-6 w-6 shrink-0 text-green-500"
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
                      <span>Sustainable cleaning solutions</span>
                    </li>
                  </ul>
                  <Button>View Bathroom Guide</Button>
                </div>
                <div className="rounded-lg bg-muted md:w-1/3"></div>
              </div>
            </Card>
          </div>
        </section>

        {/* Products Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">Recommended Products</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 font-bold">Kitchen Essentials</h3>
              <ul className="space-y-2">
                <li>Reusable produce bags</li>
                <li>Glass food containers</li>
                <li>Beeswax wraps</li>
                <li>Compost bin</li>
              </ul>
              <Button className="mt-4">Shop Now</Button>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-bold">Bathroom Essentials</h3>
              <ul className="space-y-2">
                <li>Bamboo toothbrush</li>
                <li>Shampoo bars</li>
                <li>Safety razor</li>
                <li>Reusable cotton rounds</li>
              </ul>
              <Button className="mt-4">Shop Now</Button>
            </Card>
          </div>
        </section>

        {/* Community Section */}
        <section className="rounded-lg bg-muted p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Join Our Zero Waste Community</h2>
          <p className="mb-6 text-muted-foreground">
            Connect with others on their zero waste journey, share tips, and get inspired
          </p>
          <div className="space-x-4">
            <Button variant="default">Join Community</Button>
            <Button variant="outline">Learn More</Button>
          </div>
        </section>
      </div>
    </div>
  )
}
