import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Home, Shirt, Sparkles, Recycle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Eco Living Guide | Link Flame",
  description: "Discover sustainable living tips, eco-friendly products, and guides for a greener lifestyle.",
}

const categories = [
  {
    title: "Sustainable Appliances",
    description: "Energy-efficient appliances that reduce your carbon footprint and utility bills.",
    icon: Sparkles,
    href: "/guides-and-tips/best-sustainable-appliances",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    title: "Green Home",
    description: "Transform your living space with eco-friendly solutions and sustainable practices.",
    icon: Home,
    href: "/guides-and-tips/green-home",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Sustainable Fashion & Beauty",
    description: "Ethical fashion choices and clean beauty products for conscious consumers.",
    icon: Shirt,
    href: "/guides-and-tips/fashion-beauty",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    title: "Zero Waste Living",
    description: "Practical tips and products to help reduce waste and live more sustainably.",
    icon: Recycle,
    href: "/guides-and-tips/zero-waste",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
]

export default function EcoLivingPage() {
  return (
    <div className="container py-10">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl lg:text-5xl">
          Your Guide to Sustainable Living
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-lg text-muted-foreground">
          Discover practical ways to live more sustainably and make eco-conscious choices
          that benefit both you and the planet.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Link
              key={category.title}
              href={category.href}
              className="transition-transform hover:scale-[1.02]"
            >
              <Card className="h-full">
                <CardHeader>
                  <div className={`mb-4 inline-flex rounded-lg p-2 ${category.bgColor}`}>
                    <Icon className={`size-6 ${category.color}`} />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {category.title}
                    <ArrowRight className="size-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={buttonVariants({ variant: "outline", className: "w-full" })}>
                    Learn More
                  </div>
                </CardContent>
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
