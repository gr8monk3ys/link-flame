import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProductComparison } from "@/components/product-comparison"
import { ChargingStationMap } from "@/components/charging-station-map"

export default function IndexPage() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="section-spacing text-center">
        <h1 className="text-gradient mb-6">
          Empowering Sustainable Living
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover eco-friendly solutions and make informed choices for a greener future.
          Join us in creating a sustainable world, one choice at a time.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/eco-living">
            <Button className="modern-button">Explore Eco Living</Button>
          </Link>
          <Link href="/blogs">
            <Button variant="outline" className="modern-button">
              Read Our Blog
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-spacing">
        <h2 className="text-center mb-12">Why Choose Sustainable Living?</h2>
        <div className="modern-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-effect p-6 rounded-lg hover-card-effect"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product Comparison Section */}
      <section className="section-spacing">
        <h2 className="text-center mb-12">Compare Sustainable Products</h2>
        <ProductComparison />
      </section>

      {/* Map Section */}
      <section className="section-spacing">
        <h2 className="text-center mb-12">Find Charging Stations Near You</h2>
        <div className="glass-effect p-4 rounded-lg">
          <ChargingStationMap />
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing bg-primary/5 rounded-3xl">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-gradient mb-6">Ready to Make a Difference?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join our community of eco-conscious individuals and start your journey
            towards sustainable living today.
          </p>
          <Button className="modern-button" size="lg">
            Get Started
          </Button>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    title: "Reduce Carbon Footprint",
    description: "Make eco-conscious choices that help reduce your environmental impact.",
    icon: (
      <svg
        className="w-6 h-6 text-primary"
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
    ),
  },
  {
    title: "Save Energy & Money",
    description: "Discover energy-efficient solutions that benefit both the planet and your wallet.",
    icon: (
      <svg
        className="w-6 h-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Smart Living",
    description: "Integrate smart technologies for a more sustainable and convenient lifestyle.",
    icon: (
      <svg
        className="w-6 h-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
  },
  {
    title: "Community Impact",
    description: "Be part of a growing community committed to environmental sustainability.",
    icon: (
      <svg
        className="w-6 h-6 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
]
