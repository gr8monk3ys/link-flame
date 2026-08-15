import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Home, Shirt, Sparkles, Recycle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Eco Living Guide",
  description: "Discover sustainable living tips, eco-friendly products, and guides for a greener lifestyle.",
}

const categories = [
  {
    title: "Sustainable Appliances",
    description: "Energy-efficient appliances that reduce your carbon footprint and utility bills.",
    icon: Sparkles,
    href: "/guides-and-tips/best-sustainable-appliances",
  },
  {
    title: "Green Home",
    description: "Transform your living space with eco-friendly solutions and sustainable practices.",
    icon: Home,
    href: "/guides-and-tips/green-home",
  },
  {
    title: "Sustainable Fashion & Beauty",
    description: "Ethical fashion choices and clean beauty products for conscious consumers.",
    icon: Shirt,
    href: "/guides-and-tips/fashion-beauty",
  },
  {
    title: "Zero Waste Living",
    description: "Practical tips and products to help reduce waste and live more sustainably.",
    icon: Recycle,
    href: "/guides-and-tips/zero-waste",
  },
]

export default function EcoLivingPage() {
  return (
    <div className="container py-10">
      {/* Hero Section */}
      <div className="mb-16 max-w-2xl">
        <h1 className="font-serif text-3xl leading-tight tracking-tight md:text-4xl">
          Your guide to sustainable living
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Discover practical ways to live more sustainably and make eco-conscious choices
          that benefit both you and the planet.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Link key={category.title} href={category.href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-warm-md">
                <CardHeader>
                  <div className="mb-4 inline-flex self-start rounded-lg bg-primary/10 p-2">
                    <Icon className="size-6 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {category.title}
                    <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* CTA Section */}
      <div className="mt-16 rounded-lg bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-bold">Ready to Start Your Eco Journey?</h2>
        <p className="mx-auto mt-4 max-w-[600px] text-muted-foreground">
          Join our community of eco-conscious individuals making a positive impact
          on the environment, one step at a time.
        </p>
        <Link
          href="/community/join"
          className={buttonVariants({ size: "lg", className: "mt-6" })}
        >
          Join Our Community
        </Link>
      </div>
    </div>
  )
}
