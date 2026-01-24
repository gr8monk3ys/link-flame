import { prisma } from '@/lib/prisma'
import { BrandCard } from '@/components/brands'
import Link from 'next/link'
import { ArrowRight, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

async function getFeaturedBrands() {
  const brands = await prisma.brand.findMany({
    where: {
      isActive: true,
      featured: true,
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
    take: 6,
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  })

  // Parse JSON fields
  return brands.map((brand) => ({
    ...brand,
    certifications: brand.certifications ? JSON.parse(brand.certifications) : [],
    values: brand.values ? JSON.parse(brand.values) : [],
    productCount: brand._count.products,
  }))
}

export async function FeaturedBrands() {
  const brands = await getFeaturedBrands()

  if (brands.length === 0) {
    return null
  }

  return (
    <section className="bg-gradient-to-b from-white to-gray-50/50 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100">
            <Building2 className="size-6 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Featured Partner Brands
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            We partner with brands that share our commitment to sustainability.
            Each brand is carefully vetted for their eco-friendly practices and ethical values.
          </p>
        </div>

        {/* Brand Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              variant="featured"
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button asChild size="lg" variant="outline" className="group">
            <Link href="/brands">
              View All Brands
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default FeaturedBrands
