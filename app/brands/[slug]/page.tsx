import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { BrandHero, BrandStory, BrandProducts, type BrandProduct } from '@/components/brands'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface BrandPageProps {
  params: Promise<{ slug: string }>
}

async function getBrand(slug: string) {
  const brand = await prisma.brand.findUnique({
    where: {
      slug,
      isActive: true,
    },
    include: {
      products: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          salePrice: true,
          image: true,
          category: true,
          inventory: true,
          featured: true,
          isPlasticFree: true,
          isVegan: true,
          isCrueltyFree: true,
          isOrganicCertified: true,
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
      },
    },
  })

  if (!brand) {
    return null
  }

  // Parse JSON fields and normalize products
  const normalizedBrand = {
    ...brand,
    certifications: brand.certifications ? JSON.parse(brand.certifications) : [],
    values: brand.values ? JSON.parse(brand.values) : [],
    products: brand.products.map((product): BrandProduct => ({
      ...product,
      averageRating:
        product.reviews.length > 0
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
          : null,
      reviewCount: product.reviews.length,
    })),
  }

  return normalizedBrand
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params
  const brand = await getBrand(slug)

  if (!brand) {
    return {
      title: 'Brand Not Found | Link Flame',
    }
  }

  return {
    title: `${brand.name} | Link Flame`,
    description: brand.description || `Discover eco-friendly products from ${brand.name} at Link Flame.`,
    openGraph: {
      title: `${brand.name} | Link Flame`,
      description: brand.description || `Discover eco-friendly products from ${brand.name} at Link Flame.`,
      type: 'website',
      images: brand.logo ? [{ url: brand.logo, alt: brand.name }] : [],
    },
  }
}

export async function generateStaticParams() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: { slug: true },
  })

  return brands.map((brand) => ({
    slug: brand.slug,
  }))
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params
  const brand = await getBrand(slug)

  if (!brand) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8">
        <Link
          href="/brands"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="mr-1 size-4" />
          Back to Brand Directory
        </Link>
      </div>

      {/* Hero Section */}
      <BrandHero brand={brand} />

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Brand Story */}
        <BrandStory
          story={brand.story}
          certifications={brand.certifications}
          values={brand.values}
        />

        {/* Products Section */}
        <BrandProducts
          products={brand.products}
          brandName={brand.name}
          className="border-t"
        />
      </div>
    </div>
  )
}
