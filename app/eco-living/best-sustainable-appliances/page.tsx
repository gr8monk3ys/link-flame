import { Metadata } from "next"
import { ProductComparison } from "@/components/product-comparison"
import { SustainabilityCalculator } from "@/components/sustainability-calculator"
import { Separator } from "@/components/ui/separator"
import { ProductWithRelations } from "@/app/admin/products/columns"

export const metadata: Metadata = {
  title: "Best Eco-Friendly Home Appliances 2024 | Link Flame",
  description:
    "Compare the most energy-efficient and sustainable home appliances. Expert reviews, environmental impact scores, and buying guide.",
}

// In a real app, this would come from your database or CMS
const sampleProducts: ProductWithRelations[] = [
  {
    id: "1",
    name: "EcoWash Pro 3000",
    slug: "ecowash-pro-3000",
    description: "High-efficiency washing machine with eco-friendly features",
    categoryId: "washing-machines",
    manufacturerId: "greentech-appliances",
    category: {
      id: "washing-machines",
      name: "Washing Machines",
      slug: "washing-machines",
      description: "Energy-efficient washing machines",
      parentId: null
    },
    features: [
      "Uses 50% less water than standard machines",
      "A+++ energy rating",
      "Biodegradable components",
      "Smart load detection",
    ],
    specifications: {
      capacity: "8kg",
      energyConsumption: "100kWh/year",
      waterConsumption: "9000L/year",
    },
    pros: [
      "Extremely energy efficient",
      "Long lifespan",
      "Smart features",
    ],
    cons: ["Premium price point", "Limited color options"],
    affiliateUrl: "https://example.com/buy",
    price: {
      id: "price-1",
      productId: "1",
      amount: 899.99,
      currency: "USD",
      unit: null,
      discountedFrom: null,
    },
    images: [
      {
        id: "img-1",
        productId: "1",
        url: "/images/products/ecowash-pro-3000.jpg",
        alt: "EcoWash Pro 3000",
        isMain: true
      }
    ],
    sustainabilityScore: {
      id: "score-1",
      productId: "1",
      overall: 9.2,
      carbonFootprint: 8.5,
      materialSourcing: 9.0,
      manufacturingProcess: 9.5,
      packaging: 9.0,
      endOfLife: 9.5,
      socialImpact: 9.0,
    },
    comparisonNotes: "Best-in-class energy efficiency with smart features",
    createdAt: new Date("2024-01-15"),
    sponsored: false,
    featured: true,
    ranking: 1,
    lastUpdated: new Date("2024-01-15"),
  },
  // Add more sample products...
]

export default function SustainableAppliancesPage() {
  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="prose max-w-none">
        <h1>Best Eco-Friendly Home Appliances (2024)</h1>
        <p className="lead">
          Looking to make your home more sustainable? Our comprehensive guide
          compares the most energy-efficient and eco-friendly appliances
          available today. We analyze everything from energy consumption to
          manufacturing practices to help you make an informed decision.
        </p>
      </div>

      <Separator className="my-8" />

      <ProductComparison
        products={sampleProducts}
      />

      <div className="prose mt-8 max-w-none">
        <h2>How We Rate Sustainable Appliances</h2>
        <p>
          Our comprehensive rating system considers multiple factors to determine
          the true environmental impact of each appliance:
        </p>
        <ul>
          <li>Energy efficiency and consumption</li>
          <li>Water usage (where applicable)</li>
          <li>Manufacturing processes and materials</li>
          <li>Packaging and shipping impact</li>
          <li>End-of-life recyclability</li>
          <li>Third-party certifications</li>
          <li>Company sustainability commitments</li>
        </ul>
      </div>

      <Separator className="my-8" />

      <div className="prose max-w-none">
        <h2>Calculate Your Appliance&apos;s Environmental Impact</h2>
        <p>
          Use our calculator to estimate the environmental impact of your current
          appliances and see how much you could save by switching to more
          efficient models.
        </p>
      </div>

      <SustainabilityCalculator />

      <div className="mt-8 text-sm text-muted-foreground">
        <p>
          Disclaimer: Our recommendations are based on extensive research and
          expert analysis. We may earn a commission through affiliate links at
          no extra cost to you.
        </p>
      </div>
    </div>
  )
}
