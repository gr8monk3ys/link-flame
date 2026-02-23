import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        inventory: { gt: 0 },
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 8,
      include: {
        reviews: {
          select: { rating: true },
        },
      },
    })

    return products.map((p) => ({
      ...p,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      avgRating:
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : null,
      reviewCount: p.reviews.length,
    }))
  } catch {
    return []
  }
}

function EcoBadges({ product }: { product: { isPlasticFree?: boolean; isVegan?: boolean; isCrueltyFree?: boolean; isOrganicCertified?: boolean } }) {
  const badges: string[] = []
  if (product.isOrganicCertified) badges.push('Organic')
  if (product.isPlasticFree) badges.push('Plastic-Free')
  if (product.isVegan) badges.push('Vegan')
  if (product.isCrueltyFree) badges.push('Cruelty-Free')

  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {badges.slice(0, 2).map((badge) => (
        <Badge key={badge} variant="secondary" className="text-xs">
          {badge}
        </Badge>
      ))}
    </div>
  )
}

export async function FeaturedProducts() {
  const products = await getFeaturedProducts()

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <ShoppingBag className="size-6 text-primary" />
          </div>
          <h2 className="font-serif text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Featured Products
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Discover our latest eco-friendly products, carefully selected for quality and sustainability.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const displayPrice = product.salePrice ?? product.price
            const hasDiscount = product.salePrice !== null && product.salePrice < product.price

            return (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="group h-full overflow-hidden transition-shadow hover:shadow-warm-md">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {hasDiscount && (
                      <Badge className="absolute left-2 top-2 bg-red-500 text-white">
                        Sale
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {product.category}
                    </p>
                    <h3 className="mb-2 line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary">
                      {product.title}
                    </h3>
                    <div className="mb-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-foreground">
                        ${displayPrice.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {product.avgRating !== null && (
                      <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="text-amber-400">{'★'.repeat(Math.round(product.avgRating))}</span>
                        <span>({product.reviewCount})</span>
                      </div>
                    )}
                    <EcoBadges product={product} />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg" variant="outline" className="group">
            <Link href="/collections">
              View All Products
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default FeaturedProducts
