import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductGrid } from "@/components/product-grid"
import { CarbonFootprintCalculator } from "@/components/carbon-footprint-calculator"
import { EnergySavingsCalculator } from "@/components/energy-savings-calculator"
import { NewsletterSignup } from "@/components/newsletter-signup"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Green Home & Garden | LinkFlame",
  description: "Transform your home into an eco-friendly sanctuary with our comprehensive guides, calculators, and sustainable product recommendations.",
}

export default function GreenHomePage() {
  return (
    <div className="container py-10">
      <div className="mb-8 flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Green Home & Garden
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Make your home more sustainable with our eco-friendly guides, energy-saving tips, and carefully selected products.
        </p>
      </div>

      {/* Quick Links */}
      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <CardHeader className="p-0">
            <CardTitle className="text-lg">Energy Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 p-0">
            <ul className="space-y-2">
              <li>
                <Link href="#energy-calculator" className="text-sm text-primary hover:underline">
                  Calculate Energy Savings
                </Link>
              </li>
              <li>
                <Link href="/eco-living/green-home/solar" className="text-sm text-primary hover:underline">
                  Solar Power Guide
                </Link>
              </li>
              <li>
                <Link href="/eco-living/green-home/insulation" className="text-sm text-primary hover:underline">
                  Home Insulation Tips
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0">
            <CardTitle className="text-lg">Water Conservation</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 p-0">
            <ul className="space-y-2">
              <li>
                <Link href="/eco-living/green-home/water" className="text-sm text-primary hover:underline">
                  Water-Saving Guide
                </Link>
              </li>
              <li>
                <Link href="/eco-living/green-home/rainwater" className="text-sm text-primary hover:underline">
                  Rainwater Harvesting
                </Link>
              </li>
              <li>
                <Link href="/eco-living/green-home/greywater" className="text-sm text-primary hover:underline">
                  Greywater Systems
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0">
            <CardTitle className="text-lg">Sustainable Garden</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 p-0">
            <ul className="space-y-2">
              <li>
                <Link href="/eco-living/green-home/composting" className="text-sm text-primary hover:underline">
                  Composting Guide
                </Link>
              </li>
              <li>
                <Link href="/eco-living/green-home/native-plants" className="text-sm text-primary hover:underline">
                  Native Plants Guide
                </Link>
              </li>
              <li>
                <Link href="/eco-living/green-home/permaculture" className="text-sm text-primary hover:underline">
                  Permaculture Basics
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="p-0">
            <CardTitle className="text-lg">Eco Products</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 p-0">
            <ul className="space-y-2">
              <li>
                <Link href="/eco-living/green-home/appliances" className="text-sm text-primary hover:underline">
                  Energy-Efficient Appliances
                </Link>
              </li>
              <li>
                <Link href="/eco-living/green-home/cleaning" className="text-sm text-primary hover:underline">
                  Natural Cleaning Products
                </Link>
              </li>
              <li>
                <Link href="/eco-living/green-home/furniture" className="text-sm text-primary hover:underline">
                  Sustainable Furniture
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Calculators Section */}
      <div className="mb-10">
        <h2 className="mb-6 text-2xl font-semibold">Sustainability Calculators</h2>
        <Tabs defaultValue="carbon">
          <TabsList className="mb-4">
            <TabsTrigger value="carbon">Carbon Footprint</TabsTrigger>
            <TabsTrigger value="energy">Energy Savings</TabsTrigger>
          </TabsList>
          <TabsContent value="carbon">
            <Card className="p-6">
              <CardHeader className="p-0">
                <CardTitle>Calculate Your Carbon Footprint</CardTitle>
                <CardDescription>
                  Understand your household&apos;s environmental impact and get personalized recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-6 p-0">
                <CarbonFootprintCalculator />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="energy" id="energy-calculator">
            <Card className="p-6">
              <CardHeader className="p-0">
                <CardTitle>Energy Savings Calculator</CardTitle>
                <CardDescription>
                  Calculate potential savings from energy-efficient upgrades and find the best investments for your home.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-6 p-0">
                <EnergySavingsCalculator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Featured Products */}
      <div className="mb-10">
        <h2 className="mb-6 text-2xl font-semibold">Recommended Products</h2>
        <ProductGrid category="green-home" limit={4} />
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link href="/reviews?category=green-home">View All Products</Link>
          </Button>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="mb-10">
        <NewsletterSignup />
      </div>
    </div>
  )
}
