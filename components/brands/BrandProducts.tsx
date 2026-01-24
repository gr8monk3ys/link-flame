'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { StarIcon, Leaf, ShoppingBag } from 'lucide-react'

export interface BrandProduct {
  id: string
  title: string
  description: string | null
  price: number
  salePrice: number | null
  image: string
  category: string
  inventory: number
  featured: boolean
  isPlasticFree?: boolean
  isVegan?: boolean
  isCrueltyFree?: boolean
  isOrganicCertified?: boolean
  averageRating: number | null
  reviewCount: number
}

export interface BrandProductsProps {
  products: BrandProduct[]
  brandName: string
  className?: string
}

function ProductCard({ product }: { product: BrandProduct }) {
  const isOnSale = product.salePrice && product.salePrice < product.price
  const displayPrice = product.salePrice || product.price
  const isOutOfStock = product.inventory <= 0

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.featured && (
            <Badge className="bg-primary text-xs text-primary-foreground">
              Featured
            </Badge>
          )}
          {isOnSale && (
            <Badge variant="destructive" className="text-xs">
              Sale
            </Badge>
          )}
        </div>

        {/* Eco badges */}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          {product.isPlasticFree && (
            <Badge variant="outline" className="bg-white/90 text-xs">
              Plastic-Free
            </Badge>
          )}
          {product.isVegan && (
            <Badge variant="outline" className="bg-white/90 text-xs">
              <Leaf className="mr-1 size-3" />
              Vegan
            </Badge>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="font-semibold text-white">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {product.category}
        </p>

        <h3 className="mt-1 line-clamp-2 font-medium text-foreground transition-colors group-hover:text-primary">
          {product.title}
        </h3>

        {/* Rating */}
        {product.averageRating && (
          <div className="mt-2 flex items-center gap-1">
            <div className="flex items-center">
              {[0, 1, 2, 3, 4].map((star) => (
                <StarIcon
                  key={star}
                  className={cn(
                    'size-3',
                    star < Math.round(product.averageRating!)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-semibold text-foreground">
            {formatPrice(displayPrice)}
          </span>
          {isOnSale && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function BrandProducts({ products, brandName, className }: BrandProductsProps) {
  if (products.length === 0) {
    return (
      <section className={cn('py-12', className)}>
        <h2 className="mb-8 text-2xl font-bold">
          Products from {brandName}
        </h2>
        <div className="rounded-lg border bg-gray-50 py-12 text-center">
          <ShoppingBag className="mx-auto size-12 text-gray-400" />
          <p className="mt-4 text-muted-foreground">
            No products available from this brand yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back soon for new arrivals!
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className={cn('py-12', className)}>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Products from {brandName}
        </h2>
        <p className="text-muted-foreground">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

export default BrandProducts
