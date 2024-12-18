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
const sampleProductsData = [
  {
    id: "1",
    name: "EcoWash Pro 3000",
    slug: "ecowash-pro-3000",
    description: "An energy-efficient washing machine with advanced eco features",
    categoryId: "kitchen-appliances",
    manufacturerId: "greentech-appliances",
    features: [
      "Smart load detection",
      "Eco wash cycle",
      "Steam cleaning",
      "WiFi connectivity"
    ],
    sustainabilityScore: {
      id: "eco-score-1",
      productId: "1",
      overall: 4.5,
      carbonFootprint: 4.0,
      materialSourcing: 4.0,
      manufacturingProcess: 4.5,
      packaging: 4.0,
      endOfLife: 4.5,
      socialImpact: 4.0
    },
    price: 799.99,
    images: [{ url: "/images/products/washer1.jpg" }],
    ranking: 1,
    comparisonNotes: "Top-rated eco-friendly washing machine",
    pros: ["Energy efficient", "Smart features"],
    cons: ["Higher upfront cost"],
    affiliateUrl: "https://example.com/ecowash-pro-3000",
    createdAt: new Date("2024-01-01"),
    lastUpdated: new Date("2024-01-01")
  },
  // Add more products as needed...
]

const sampleProducts = sampleProductsData.map(product => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  categoryId: product.categoryId,
  manufacturerId: product.manufacturerId,
  features: product.features,
  sustainabilityScore: product.sustainabilityScore,
  price: product.price,
  image: product.images?.[0]?.url || "/images/products/placeholder.jpg",
  rating: product.sustainabilityScore?.overall || 0,
  energyRating: "A+++",
  specs: {
    carbonFootprint: product.sustainabilityScore?.carbonFootprint || 0,
    materialSourcing: product.sustainabilityScore?.materialSourcing || 0,
    manufacturingProcess: product.sustainabilityScore?.manufacturingProcess || 0,
    packaging: product.sustainabilityScore?.packaging || 0,
    endOfLife: product.sustainabilityScore?.endOfLife || 0,
    socialImpact: product.sustainabilityScore?.socialImpact || 0
  },
  ranking: product.ranking,
  comparisonNotes: product.comparisonNotes
}))

const categories = [
  {
    title: "Kitchen Appliances",
    description: "Energy-efficient appliances for your cooking needs",
    icon: (
      <svg
        className="h-6 w-6 text-primary"
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
        className="h-6 w-6 text-primary"
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
        className="h-6 w-6 text-primary"
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
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {category.icon}
              </div>
              <h3 className="mb-2 font-semibold">{category.title}</h3>
              <p className="mb-4 text-muted-foreground">{category.description}</p>
              <div className="space-y-2">
                {category.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <svg
                      className="h-4 w-4 text-primary"
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
        <h2 className="mb-12 text-center">Compare Top Rated Appliances</h2>
        <div className="glass-effect rounded-lg p-6">
          <ProductComparison products={sampleProducts} />
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
