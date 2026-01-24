"use client"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BundleProduct {
  id: string
  product: {
    id: string
    title: string
    price: number
    salePrice: number | null
    image: string
    category: string
  }
  isRequired: boolean
  isDefault: boolean
  maxQuantity: number
}

interface BundleCardProps {
  bundle: {
    id: string
    title: string
    slug: string
    description: string | null
    image: string | null
    discountPercent: number
    isCustomizable: boolean
    minItems: number | null
    maxItems: number | null
    products: BundleProduct[]
    calculatedPricing?: {
      basePrice: number
      discountedPrice: number
      savings: number
    }
  }
  className?: string
}

export function BundleCard({ bundle, className }: BundleCardProps) {
  const pricing = bundle.calculatedPricing
  const productCount = bundle.products.length
  const previewImages = bundle.products.slice(0, 4).map((bp) => bp.product.image)

  return (
    <Card className={cn("group overflow-hidden transition-all hover:shadow-lg", className)}>
      <Link href={`/bundles/${bundle.slug}`} className="block">
        <CardHeader className="p-0">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {bundle.image ? (
              <Image
                src={bundle.image}
                alt={bundle.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              // Grid of product images if no bundle image
              <div className="grid size-full grid-cols-2 gap-1 p-2">
                {previewImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square overflow-hidden rounded-md">
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Discount Badge */}
            <Badge className="absolute left-3 top-3 bg-green-600 text-white hover:bg-green-700">
              Save {bundle.discountPercent}%
            </Badge>

            {/* Bundle Type Badge */}
            <Badge
              variant="secondary"
              className="absolute right-3 top-3"
            >
              {bundle.isCustomizable ? "Build Your Own" : "Fixed Bundle"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
            {bundle.title}
          </h3>

          {bundle.description && (
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {bundle.description}
            </p>
          )}

          {/* Bundle Info */}
          <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {bundle.isCustomizable ? (
              <>
                {bundle.minItems && (
                  <span className="rounded-full bg-muted px-2 py-1">
                    Pick {bundle.minItems}{bundle.maxItems && bundle.maxItems !== bundle.minItems ? `-${bundle.maxItems}` : ""} items
                  </span>
                )}
              </>
            ) : (
              <span className="rounded-full bg-muted px-2 py-1">
                {productCount} products included
              </span>
            )}
          </div>

          {/* Pricing */}
          {pricing && (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-foreground">
                ${pricing.discountedPrice.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                ${pricing.basePrice.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-green-600">
                Save ${pricing.savings.toFixed(2)}
              </span>
            </div>
          )}
        </CardContent>
      </Link>

      <CardFooter className="border-t p-4">
        <Button asChild className="w-full">
          <Link href={`/bundles/${bundle.slug}`}>
            {bundle.isCustomizable ? "Build Your Bundle" : "View Bundle"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
