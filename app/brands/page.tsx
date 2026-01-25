import { Metadata } from 'next'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { BrandGrid, BrandFilters } from '@/components/brands'
import { Building2 } from 'lucide-react'

// Revalidate brand pages every hour
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Brand Directory | Link Flame',
  description: 'Discover our curated collection of eco-friendly and sustainable partner brands. Shop with purpose and support businesses that share your values.',
  openGraph: {
    title: 'Brand Directory | Link Flame',
    description: 'Discover our curated collection of eco-friendly and sustainable partner brands.',
    type: 'website',
  },
}

interface BrandsPageProps {
  searchParams: Promise<{
    certification?: string
    value?: string
    page?: string
    pageSize?: string
  }>
}

async function getBrands(searchParams: {
  certification?: string
  value?: string
  page?: string
  pageSize?: string
}) {
  const page = parseInt(searchParams.page || '1')
  const pageSize = parseInt(searchParams.pageSize || '12')

  // Build where clause
  const where: Record<string, unknown> = {
    isActive: true,
  }

  if (searchParams.certification) {
    where.certifications = {
      contains: searchParams.certification,
    }
  }

  if (searchParams.value) {
    where.values = {
      contains: searchParams.value,
    }
  }

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    }),
    prisma.brand.count({ where }),
  ])

  // Parse JSON fields
  const normalizedBrands = brands.map((brand) => ({
    ...brand,
    certifications: brand.certifications ? JSON.parse(brand.certifications) : [],
    values: brand.values ? JSON.parse(brand.values) : [],
    productCount: brand._count.products,
  }))

  return {
    brands: normalizedBrands,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

function BrandsLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border bg-card"
        >
          <div className="aspect-square bg-gray-200" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function BrandsContent({
  searchParams,
}: {
  searchParams: {
    certification?: string
    value?: string
    page?: string
    pageSize?: string
  }
}) {
  const { brands, total, page, totalPages } = await getBrands(searchParams)

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">
          Showing {brands.length} of {total} brands
        </p>
      </div>

      <BrandGrid brands={brands} variant="default" columns={4} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <a
              key={pageNum}
              href={`/brands?${new URLSearchParams({
                ...searchParams,
                page: pageNum.toString(),
              }).toString()}`}
              className={`rounded-lg border px-4 py-2 ${
                pageNum === page
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </a>
          ))}
        </div>
      )}
    </>
  )
}

export default async function BrandsPage({ searchParams }: BrandsPageProps) {
  const resolvedSearchParams = await searchParams

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <Building2 className="size-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Brand Directory
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Discover our curated collection of eco-friendly and sustainable partner brands.
            Shop with purpose and support businesses that share your values.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-gray-200" />}>
                <BrandFilters />
              </Suspense>
            </div>
          </div>

          {/* Brand Grid */}
          <div className="lg:col-span-3">
            {/* Mobile Filters */}
            <div className="mb-6 lg:hidden">
              <details className="rounded-lg border bg-white p-4">
                <summary className="cursor-pointer font-medium">
                  Filters
                </summary>
                <div className="mt-4">
                  <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-gray-200" />}>
                    <BrandFilters />
                  </Suspense>
                </div>
              </details>
            </div>

            <Suspense fallback={<BrandsLoading />}>
              <BrandsContent searchParams={resolvedSearchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
