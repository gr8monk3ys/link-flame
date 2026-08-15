import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TransportCalculator } from "@/components/guides-and-tips/transport-calculator"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Clean Transportation",
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
            <Link href="/guides-and-tips/clean-transport/ev-guide" className="block hover:underline">
              Electric Vehicle Buying Guide
            </Link>
            <Link href="/guides-and-tips/clean-transport/e-bikes" className="block hover:underline">
              E-Bike Comparison Guide
            </Link>
            <Link href="/guides-and-tips/clean-transport/eco-travel" className="block hover:underline">
              Sustainable Travel Tips
            </Link>
            <Link href="/guides-and-tips/clean-transport/charging" className="block hover:underline">
              EV Charging Guide
            </Link>
          </div>
          <Button asChild className="mt-4">
            <Link href="/guides-and-tips/clean-transport/guides">View All Guides</Link>
          </Button>
        </Card>

        {/* Calculator Section */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Transport Impact Calculator</h2>
          <TransportCalculator />
        </Card>
      </div>

      {/* Shop CTA */}
      <div className="my-8 rounded-lg bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-semibold">Cutting waste beyond the commute?</h2>
        <p className="mx-auto mt-2 max-w-[600px] text-muted-foreground">
          The shop covers the everyday side of lower-impact living — kitchen,
          bathroom, and laundry swaps, each with its measured yearly impact.
        </p>
        <Button asChild className="mt-6">
          <Link href="/collections">Shop all products</Link>
        </Button>
      </div>
    </div>
  )
}
