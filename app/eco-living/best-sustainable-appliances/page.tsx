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

const categories = [
  {
    title: "Kitchen Appliances",
    description: "Energy-efficient appliances for your cooking needs",
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
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
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
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
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
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover energy-efficient appliances that help reduce your carbon footprint
          while saving you money on utility bills.
        </p>
      </section>

      {/* Categories Grid */}
      <section className="section-spacing">
        <h2 className="text-center mb-12">Popular Categories</h2>
        <div className="card-grid">
          {categories.map((category, index) => (
            <div
              key={index}
              className="glass-effect p-6 rounded-lg hover-card-effect"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {category.icon}
              </div>
              <h3 className="font-semibold mb-2">{category.title}</h3>
              <p className="text-muted-foreground mb-4">{category.description}</p>
              <div className="space-y-2">
                {category.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <svg
                      className="w-4 h-4 text-primary"
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

      {/* Product Comparison Section */}
      <section className="section-spacing">
        <h2 className="text-center mb-12">Compare Top Rated Appliances</h2>
        <div className="glass-effect p-6 rounded-lg">
          <ProductComparison products={sampleProducts} />
        </div>
      </section>

      {/* Buying Guide */}
      <section className="section-spacing bg-primary/5 rounded-3xl">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center mb-8">Sustainable Appliance Buying Guide</h2>
          <div className="space-y-6">
            {buyingGuide.map((tip, index) => (
              <div key={index} className="glass-effect p-6 rounded-lg">
                <h3 className="font-semibold mb-2">{tip.title}</h3>
                <p className="text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
