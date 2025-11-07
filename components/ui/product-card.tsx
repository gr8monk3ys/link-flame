"use client"

import Image from "next/image"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating"
import { useCart } from "@/lib/providers/CartProvider";
import { useSession } from "next-auth/react";

export type TopPickProduct = {
  id: string
  title: string
  description: string
  image: string
  url: string
}

interface TopPickProductCardProps {
  variant: "topPick"
  product: TopPickProduct
}

interface AdminProductCardProps {
  variant: "admin"
  product: any // ProductWithRelations
}

type ProductCardProps = TopPickProductCardProps | AdminProductCardProps

const ProductCard = (props: ProductCardProps) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { addItemToCart } = useCart()
  if (props.variant === "admin") {
    const { product } = props
    return (
      <Card key={product.id}>
        <CardHeader>
          <AspectRatio ratio={1}>
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="rounded-md object-cover"
            />
          </AspectRatio>
        </CardHeader>
        <CardContent>
          <CardTitle>{product.title}</CardTitle>
          {product.description && (
            <CardDescription>{product.description}</CardDescription>
          )}
          <div className="mt-2 space-y-2">
            <div className="flex flex-col">
              <span>${product.price.toFixed(2)}</span>
            </div>
            {product.reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={product.reviews.reduce((acc: number, review: {rating: number}) => acc + review.rating, 0) / product.reviews.length} />
                <span className="text-sm text-muted-foreground">
                  ({product.reviews.length} reviews)
                </span>
              </div>
            )}
          </div>
          {userId && (
            <button
              className={buttonVariants({
                variant: "default",
                className: "w-full",
              })}
              onClick={() => addItemToCart({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                quantity: 1,
              })}
            >
              Add to Cart
            </button>
          )}
        </CardContent>
      </Card>
    )
  }

  // TopPick variant
  const { product } = props
  return (
    <Card key={product.id}>
      <CardHeader>
        <AspectRatio ratio={1}>
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="rounded-md object-cover"
          />
        </AspectRatio>
      </CardHeader>
      <CardContent>
        <CardTitle>{product.title}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardContent>
      <CardFooter>
        <a
          href={product.url}
          className={buttonVariants({
            variant: "outline",
            className: "w-full",
          })}
        >
          View Details
        </a>
        {userId && (
          <button
            className={buttonVariants({
              variant: "default",
              className: "w-full",
            })}
            onClick={() => addItemToCart({
              id: product.id,
              title: product.title,
              price: 0, // TopPick doesn't have price, may need to fetch
              image: product.image,
              quantity: 1,
            })}
          >
            Add to Cart
          </button>
        )}
      </CardFooter>
    </Card>
  )
}

export default ProductCard
