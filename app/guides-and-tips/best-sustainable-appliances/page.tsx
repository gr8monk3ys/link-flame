import { Metadata } from "next"
import { SustainabilityCalculator } from "@/components/guides-and-tips/sustainability-calculator"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Best Eco-Friendly Home Appliances 2026 | Link Flame",
  description:
    "Compare the most energy-efficient and sustainable home appliances. Expert reviews, environmental impact scores, and buying guide.",
}

const categories = [
  {
    title: "Kitchen Appliances",
    description: "Energy-efficient appliances for your cooking needs",
    features: [
      "Energy Star certified",
      "Smart temperature control",
      "Water-saving features",
      "Long-lasting materials",
    ],
  },
  {
    title: "Laundry Solutions",
    description: "Water and energy-efficient washing machines and dryers",
    features: [
      "High efficiency models",
      "Cold water washing",
      "Quick wash cycles",
      "Heat pump technology",
    ],
  },
  {
    title: "HVAC Systems",
    description: "Smart heating and cooling solutions for your home",
    features: [
      "Smart thermostats",
      "Zone control",
      "Air quality monitoring",
      "Energy recovery",
    ],
  },
]

const buyingGuide = [
  {
    title: "Check Energy Ratings",
    description:
      "Look for Energy Star certification and compare annual energy consumption estimates between models.",
  },
  {
    title: "Consider Lifecycle Costs",
    description:
      "Factor in both purchase price and estimated annual operating costs when comparing appliances.",
  },
  {
    title: "Size Matters",
    description:
      "Choose appropriately sized appliances for your needs - oversized units waste energy and money.",
  },
  {
    title: "Look for Smart Features",
    description:
      "Smart appliances can help optimize energy usage and provide better control over consumption.",
  },
]

export default function SustainableAppliancesPage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="section-spacing text-center">
        <h1 className="text-gradient mb-6">
          Best Sustainable Appliances
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Discover energy-efficient appliances that help reduce your carbon footprint
          while saving you money on utility bills.
        </p>
      </section>

      {/* Categories Grid */}
      <section className="section-spacing">
        <h2 className="mb-12 text-center">Popular Categories</h2>
        <div className="card-grid">
          {categories.map((category, index) => (
            <div
              key={index}
              className="glass-effect hover-card-effect rounded-lg p-6"
            >
              <h3 className="mb-2 font-semibold">{category.title}</h3>
              <p className="mb-4 text-muted-foreground">{category.description}</p>
              <div className="space-y-2">
                {category.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <svg
                      className="size-4 text-primary"
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
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Browse Products CTA */}
      <section className="section-spacing text-center">
        <h2 className="mb-4">Browse Eco-Friendly Products</h2>
        <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
          Explore our curated collection of sustainable products, vetted for environmental impact and quality.
        </p>
        <Button asChild size="lg">
          <Link href="/collections">View All Products</Link>
        </Button>
      </section>

      {/* Sustainability Calculator */}
      <section className="section-spacing">
        <h2 className="mb-8 text-center">Calculate Your Impact</h2>
        <div className="glass-effect mx-auto max-w-2xl rounded-lg p-6">
          <SustainabilityCalculator />
        </div>
      </section>

      {/* Buying Guide */}
      <section className="section-spacing rounded-3xl bg-primary/5">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center">Sustainable Appliance Buying Guide</h2>
          <div className="space-y-6">
            {buyingGuide.map((tip, index) => (
              <div key={index} className="glass-effect rounded-lg p-6">
                <h3 className="mb-2 font-semibold">{tip.title}</h3>
                <p className="text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
