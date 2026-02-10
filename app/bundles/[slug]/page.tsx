import { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BundleBuilder } from "@/components/bundles/BundleBuilder"

// Render at request time — DB not available during Vercel build
export const dynamic = 'force-dynamic';

interface BundlePageProps {
  params: Promise<{ slug: string }>
}

async function getBundle(slug: string) {
  const bundle = await prisma.bundle.findUnique({
    where: { slug, isActive: true },
    include: {
      products: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              salePrice: true,
              image: true,
              category: true,
              inventory: true,
            },
          },
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  })

  if (!bundle) return null

  // For customizable bundles, also fetch available products from the category
  let availableProducts: Array<{
    id: string
    title: string
    description: string | null
    price: number
    salePrice: number | null
    image: string
    category: string
    inventory: number
  }> = []

  if (bundle.isCustomizable) {
    const where = bundle.category
      ? { category: bundle.category, inventory: { gt: 0 } }
      : { inventory: { gt: 0 } }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        salePrice: true,
        image: true,
        category: true,
        inventory: true,
      },
      take: bundle.category ? undefined : 50,
      orderBy: {
        title: "asc",
      },
    })
    availableProducts = products.map(p => ({ ...p, price: Number(p.price), salePrice: p.salePrice ? Number(p.salePrice) : null }))
  }

  // Calculate pricing based on bundle products
  const bundleProducts = bundle.products.map((bp) => ({
    ...bp,
    product: { ...bp.product, price: Number(bp.product.price), salePrice: bp.product.salePrice ? Number(bp.product.salePrice) : null },
    effectivePrice: Number(bp.product.salePrice || bp.product.price),
  }))

  const basePrice = bundleProducts.reduce((sum, bp) => {
    return sum + bp.effectivePrice * bp.maxQuantity
  }, 0)

  const discountedPrice = basePrice * (1 - bundle.discountPercent / 100)
  const savings = basePrice - discountedPrice

  return {
    ...bundle,
    products: bundleProducts,
    availableProducts,
    pricing: {
      basePrice: Number(basePrice.toFixed(2)),
      discountedPrice: Number(discountedPrice.toFixed(2)),
      savings: Number(savings.toFixed(2)),
      discountPercent: bundle.discountPercent,
    },
  }
}

export async function generateMetadata({
  params,
}: BundlePageProps): Promise<Metadata> {
  const { slug } = await params
  const bundle = await getBundle(slug)

  if (!bundle) {
    return {
      title: "Bundle Not Found | Link Flame",
    }
  }

  return {
    title: `${bundle.title} | Link Flame Bundles`,
    description:
      bundle.description ||
      `Save ${bundle.discountPercent}% with our ${bundle.title} bundle. ${
        bundle.isCustomizable
          ? "Build your own kit!"
          : "Get everything you need in one package."
      }`,
    openGraph: {
      title: bundle.title,
      description: bundle.description || undefined,
      images: bundle.image ? [bundle.image] : undefined,
    },
  }
}

export default async function BundlePage({ params }: BundlePageProps) {
  const { slug } = await params
  const bundle = await getBundle(slug)

  if (!bundle) {
    notFound()
  }

  return <BundleBuilder bundle={bundle} />
}
