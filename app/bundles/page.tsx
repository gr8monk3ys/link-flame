import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { BundleCard } from "@/components/bundles/BundleCard"

export const metadata: Metadata = {
  title: "Product Bundles | Link Flame",
  description:
    "Save more with our curated product bundles. Build your own bundle or choose from our pre-made kits featuring eco-friendly essentials.",
}

// Revalidate every 5 minutes
export const revalidate = 300

async function getBundles() {
  const bundles = await prisma.bundle.findMany({
    where: { isActive: true },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              salePrice: true,
              image: true,
              category: true,
            },
          },
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Calculate pricing for each bundle
  return bundles.map((bundle) => {
    const products = bundle.products.map(bp => ({
      ...bp,
      product: { ...bp.product, price: Number(bp.product.price), salePrice: bp.product.salePrice ? Number(bp.product.salePrice) : null },
    }))
    const basePrice = products.reduce((sum, bp) => {
      const productPrice = bp.product.salePrice || bp.product.price
      return sum + productPrice * bp.maxQuantity
    }, 0)

    const discountedPrice = basePrice * (1 - bundle.discountPercent / 100)
    const savings = basePrice - discountedPrice

    return {
      ...bundle,
      products,
      calculatedPricing: {
        basePrice: Number(basePrice.toFixed(2)),
        discountedPrice: Number(discountedPrice.toFixed(2)),
        savings: Number(savings.toFixed(2)),
      },
    }
  })
}

export default async function BundlesPage() {
  const bundles = await getBundles()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">Product Bundles</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Save more with our curated bundles! Build your own eco-friendly kit or
          choose from our pre-made bundles featuring bestselling sustainable
          products.
        </p>
      </div>

      {/* Bundle Categories */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          All Bundles
        </button>
        <button className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80">
          Build Your Own
        </button>
        <button className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80">
          Fixed Bundles
        </button>
      </div>

      {/* Bundles Grid */}
      {bundles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">
            No bundles available at the moment. Check back soon!
          </p>
        </div>
      )}

      {/* Benefits Section */}
      <div className="mt-16 rounded-2xl bg-muted p-8">
        <h2 className="mb-8 text-center text-2xl font-bold">
          Why Shop Bundles?
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-6"
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
            </div>
            <h3 className="mb-2 font-semibold">Save Up to 25%</h3>
            <p className="text-sm text-muted-foreground">
              Bundle products together and unlock exclusive discounts you will not find
              anywhere else.
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold">Curated Collections</h3>
            <p className="text-sm text-muted-foreground">
              Our bundles are carefully curated to give you everything you need
              to start your eco-friendly journey.
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold">Customize Your Kit</h3>
            <p className="text-sm text-muted-foreground">
              Build your own bundle and pick exactly what you need. Mix and
              match your favorite products.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
