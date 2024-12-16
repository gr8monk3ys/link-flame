import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { ProductDisplay } from "@/components/product-display"
import { NewsletterSignup } from "@/components/newsletter-signup"
import Link from "next/link"

const featuredProducts = [
  {
    id: 1,
    title: "Smart LED Light Bulbs Pack",
    description: "Energy-efficient smart bulbs with app control and scheduling features. Save up to 80% on energy costs.",
    image: "/images/products/smart-bulbs.jpg",
    url: "#",
    price: "$29.99",
    rating: 4.5,
    features: [
      "Voice control compatible with Alexa & Google Home",
      "Schedule and automation features",
      "Energy monitoring through app",
      "16 million colors and scenes",
    ],
    pros: [
      "80% less energy consumption",
      "Long lifespan (25,000 hours)",
      "Easy smartphone control",
    ],
    cons: [
      "Requires WiFi connection",
      "Higher upfront cost",
    ],
  },
  {
    id: 2,
    title: "Countertop Compost Bin",
    description: "Odor-free kitchen compost bin with charcoal filter. Perfect for collecting food scraps.",
    image: "/images/products/compost-bin.jpg",
    url: "#",
    price: "$34.99",
    rating: 4.8,
    features: [
      "1.3-gallon capacity",
      "Charcoal filter system",
      "Dishwasher-safe",
      "Stainless steel construction",
    ],
    pros: [
      "Completely odor-free",
      "Attractive design",
      "Easy to clean",
    ],
    cons: [
      "Filters need regular replacement",
      "Limited capacity",
    ],
  },
  {
    id: 3,
    title: "Rain Water Collection System",
    description: "Complete rain barrel system for garden irrigation. Includes filters and easy-connect spigot.",
    image: "/images/products/rain-barrel.jpg",
    url: "#",
    price: "$89.99",
    rating: 4.7,
    features: [
      "50-gallon capacity",
      "Mosquito-proof mesh screen",
      "Overflow protection",
      "UV-resistant material",
    ],
    pros: [
      "Reduces water bills",
      "Eco-friendly irrigation",
      "Easy installation",
    ],
    cons: [
      "Requires space",
      "Seasonal usefulness",
    ],
  },
]

const guides = [
  {
    title: "Starting Your Organic Garden",
    description: "A complete guide to creating and maintaining an organic vegetable garden.",
    href: "/guides/organic-gardening",
  },
  {
    title: "Home Energy Efficiency",
    description: "Tips and tricks to reduce your home's energy consumption and utility bills.",
    href: "/guides/energy-efficiency",
  },
  {
    title: "Natural Cleaning Solutions",
    description: "DIY recipes for effective, eco-friendly household cleaners.",
    href: "/guides/natural-cleaning",
  },
]

export default function GreenHomePage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Green Home & Garden
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Transform your living space into an eco-friendly haven. Discover sustainable products
          and practices that help reduce your environmental impact while creating a healthier home.
        </p>
      </div>

      {/* Featured Products Section */}
      <div className="my-8">
        <h2 className="mb-4 text-2xl font-bold">Top Eco-Friendly Products</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductDisplay key={product.id} product={product} detailed />
          ))}
        </div>
      </div>

      {/* Guides Section */}
      <div className="my-8">
        <h2 className="mb-4 text-2xl font-bold">Expert Guides</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Card key={guide.title}>
              <CardHeader>
                <CardTitle>{guide.title}</CardTitle>
                <CardDescription>{guide.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={guide.href} className={buttonVariants({ variant: "link" })}>
                  Read Guide →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Newsletter Signup */}
      <NewsletterSignup
        title="Get Green Home Tips"
        description="Subscribe for weekly eco-friendly home and garden tips, exclusive deals, and sustainable living inspiration."
        className="my-8 w-full"
      />

      {/* Related Categories */}
      <div className="my-8">
        <h2 className="mb-4 text-2xl font-bold">Explore More Categories</h2>
        <div className="flex gap-4">
          <Link href="/eco-living/zero-waste" className={buttonVariants({ variant: "outline" })}>
            Zero Waste Living
          </Link>
          <Link href="/eco-living/fashion-beauty" className={buttonVariants({ variant: "outline" })}>
            Eco Fashion & Beauty
          </Link>
          <Link href="/guides-and-tips" className={buttonVariants({ variant: "outline" })}>
            All Guides
          </Link>
        </div>
      </div>
    </section>
  )
}
