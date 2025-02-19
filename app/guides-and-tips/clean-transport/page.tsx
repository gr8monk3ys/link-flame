import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TransportCalculator } from "@/components/guides-and-tips/transport-calculator"
import { ChargingStationMap } from "@/components/home/charging-station-map"
import { ProductGrid } from "@/components/shared/product-grid"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Clean Transportation | LinkFlame",
  description: "Discover eco-friendly transportation options, from electric vehicles to sustainable travel gear.",
}

export default function CleanTransportPage() {
  return (
    <div className="container py-10">
      <div className="mb-8 flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Clean Transportation
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Explore sustainable transportation options and calculate your travel impact.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Featured Categories */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Transportation Guides</h2>
          <div className="space-y-4">
            <Link href="/clean-transport/ev-guide" className="block hover:underline">
              Electric Vehicle Buying Guide
            </Link>
            <Link href="/clean-transport/e-bikes" className="block hover:underline">
              E-Bike Comparison Guide
            </Link>
            <Link href="/clean-transport/eco-travel" className="block hover:underline">
              Sustainable Travel Tips
            </Link>
            <Link href="/clean-transport/charging" className="block hover:underline">
              EV Charging Guide
            </Link>
          </div>
          <Button asChild className="mt-4">
            <Link href="/clean-transport/guides">View All Guides</Link>
          </Button>
        </Card>

        {/* Calculator Section */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Transport Impact Calculator</h2>
          <TransportCalculator />
        </Card>
      </div>

      {/* Charging Station Map */}
      <div className="my-8">
        <h2 className="mb-6 text-2xl font-semibold">EV Charging Stations Near You</h2>
        <ChargingStationMap />
      </div>

      {/* Product Recommendations */}
      <div className="my-8">
        <h2 className="mb-6 text-2xl font-semibold">Recommended Products</h2>
        <ProductGrid category="clean-transport" limit={4} />
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link href="/reviews?category=clean-transport">View All Products</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
