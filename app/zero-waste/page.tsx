import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ZeroWasteCalculator } from "@/components/zero-waste-calculator"
import { WasteReductionTips } from "@/components/waste-reduction-tips"
import { ProductGrid } from "@/components/product-grid"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Zero Waste Living | LinkFlame",
  description: "Discover practical tips, tools, and products for reducing waste and living a more sustainable lifestyle.",
}

export default function ZeroWastePage() {
  return (
    <div className="container py-10">
      <div className="mb-8 flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Zero Waste Living
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Start your journey to a zero-waste lifestyle with our comprehensive guides, calculators, and curated products.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Featured Categories */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Getting Started</h2>
          <div className="space-y-4">
            <Link href="/zero-waste/kitchen" className="block hover:underline">
              Zero Waste Kitchen Essentials
            </Link>
            <Link href="/zero-waste/bathroom" className="block hover:underline">
              Plastic-Free Bathroom Guide
            </Link>
            <Link href="/zero-waste/shopping" className="block hover:underline">
              Sustainable Shopping Tips
            </Link>
            <Link href="/zero-waste/composting" className="block hover:underline">
              Home Composting Guide
            </Link>
          </div>
          <Button asChild className="mt-4">
            <Link href="/zero-waste/guides">View All Guides</Link>
          </Button>
        </Card>

        {/* Calculator Section */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Waste Impact Calculator</h2>
          <ZeroWasteCalculator />
        </Card>
      </div>

      {/* Tips Section */}
      <div className="my-8">
        <h2 className="mb-6 text-2xl font-semibold">Quick Tips for Reducing Waste</h2>
        <WasteReductionTips />
      </div>

      {/* Product Recommendations */}
      <div className="my-8">
        <h2 className="mb-6 text-2xl font-semibold">Essential Zero Waste Products</h2>
        <ProductGrid category="zero-waste" limit={4} />
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link href="/top-picks?category=zero-waste">View All Products</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
