"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Star, Info } from "lucide-react"

interface Product {
  id: number
  title: string
  description: string
  image: string
  url: string
  price: string
  rating: number
  features?: string[]
  pros?: string[]
  cons?: string[]
  affiliateDisclosure?: string
}

interface ProductDisplayProps {
  product: Product
  detailed?: boolean
  className?: string
}

export function ProductDisplay({
  product,
  detailed = false,
  className = "",
}: ProductDisplayProps) {
  const [showDetails, setShowDetails] = useState(false)

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <Card className={`relative ${className}`}>
      <CardHeader>
        <div className="relative mb-4 h-48 w-full">
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-contain"
          />
        </div>
        <CardTitle>{product.title}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xl font-bold">{product.price}</span>
          {renderRating(product.rating)}
        </div>

        {detailed && (
          <>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={buttonVariants({ variant: "outline" })}
            >
              <Info className="mr-2 h-4 w-4" />
              {showDetails ? "Hide Details" : "Show Details"}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-4">
                {product.features && (
                  <div>
                    <h4 className="mb-2 font-semibold">Key Features</h4>
                    <ul className="list-disc space-y-1 pl-5">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.pros && (
                  <div>
                    <h4 className="mb-2 font-semibold">Pros</h4>
                    <ul className="list-disc space-y-1 pl-5">
                      {product.pros.map((pro, index) => (
                        <li key={index} className="text-green-600">{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.cons && (
                  <div>
                    <h4 className="mb-2 font-semibold">Cons</h4>
                    <ul className="list-disc space-y-1 pl-5">
                      {product.cons.map((con, index) => (
                        <li key={index} className="text-red-600">{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <a
          href={product.url}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className={`${buttonVariants()} mt-4 w-full`}
        >
          View on Amazon
        </a>

        <p className="mt-4 text-xs text-muted-foreground">
          {product.affiliateDisclosure ||
            "As an Amazon Associate, we earn from qualifying purchases. This helps support our content creation at no extra cost to you."}
        </p>
      </CardContent>
    </Card>
  )
}
