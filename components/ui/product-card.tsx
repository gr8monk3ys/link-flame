"use client"

import Image from "next/image"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { ProductWithRelations } from "@/app/admin/products/columns"

export interface TopPickProduct {
  id: string
  title: string
  description: string
  image: string
  url: string
}

interface ProductCardProps {
  product: TopPickProduct | ProductWithRelations
  variant?: "topPick" | "admin"
}

const ProductCard = ({ product, variant = "topPick" }: ProductCardProps) => {
  if (variant === "admin") {
    const adminProduct = product as ProductWithRelations
    const mainImage = adminProduct.images?.[0]?.url // Get the first image URL if available
    return (
      <Card key={adminProduct.id}>
        <CardHeader>
          <AspectRatio ratio={1}>
            {mainImage && (
              <Image
                src={mainImage}
                alt={adminProduct.name}
                fill
                className="rounded-md object-cover"
              />
            )}
          </AspectRatio>
        </CardHeader>
        <CardContent>
          <CardTitle>{adminProduct.name}</CardTitle>
          <CardDescription>{adminProduct.description}</CardDescription>
          {adminProduct.sustainabilityScore && (
            <div className="mt-2">
              <Badge variant="secondary">
                Eco Score: {adminProduct.sustainabilityScore.overall}
              </Badge>
            </div>
          )}
        </CardContent>
        {adminProduct.affiliateUrl && (
          <CardFooter>
            <a href={adminProduct.affiliateUrl} target="_blank" rel="noreferrer" className={buttonVariants()}>
              View Details
            </a>
          </CardFooter>
        )}
      </Card>
    )
  }

  const topPickProduct = product as TopPickProduct
  return (
    <Card key={topPickProduct.id}>
      <CardHeader>
        <AspectRatio ratio={1}>
          <Image
            src={topPickProduct.image}
            alt={topPickProduct.title}
            fill
            className="rounded-md object-cover"
          />
        </AspectRatio>
      </CardHeader>
      <CardContent>
        <CardTitle>{topPickProduct.title}</CardTitle>
        <CardDescription>{topPickProduct.description}</CardDescription>
      </CardContent>
      <CardFooter>
        <a href={topPickProduct.url} target="_blank" rel="noreferrer" className={buttonVariants()}>
          View Details
        </a>
      </CardFooter>
    </Card>
  )
}

export default ProductCard
