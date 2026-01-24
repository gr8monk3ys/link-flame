"use client"

import { useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ShoppingCart, Loader2, Check, Tag } from "lucide-react"

interface SelectedItem {
  productId: string
  quantity: number
}

interface Product {
  id: string
  title: string
  price: number
  salePrice: number | null
  image: string
}

interface BundleSummaryProps {
  bundleTitle: string
  discountPercent: number
  selectedItems: SelectedItem[]
  products: Product[]
  minItems: number | null
  maxItems: number | null
  isLoading?: boolean
  onAddToCart: () => void
  className?: string
}

export function BundleSummary({
  bundleTitle,
  discountPercent,
  selectedItems,
  products,
  minItems,
  maxItems,
  isLoading = false,
  onAddToCart,
  className,
}: BundleSummaryProps) {
  // Create a product lookup map
  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]))
  }, [products])

  // Calculate totals
  const { itemsWithDetails, subtotal, discountAmount, total, totalItems } = useMemo(() => {
    const items = selectedItems
      .map((item) => {
        const product = productMap.get(item.productId)
        if (!product) return null

        const effectivePrice = product.salePrice || product.price
        const lineTotal = effectivePrice * item.quantity

        return {
          ...item,
          product,
          effectivePrice,
          lineTotal,
        }
      })
      .filter(Boolean) as Array<{
        productId: string
        quantity: number
        product: Product
        effectivePrice: number
        lineTotal: number
      }>

    const sub = items.reduce((sum, item) => sum + item.lineTotal, 0)
    const discount = sub * (discountPercent / 100)
    const tot = sub - discount
    const count = items.reduce((sum, item) => sum + item.quantity, 0)

    return {
      itemsWithDetails: items,
      subtotal: sub,
      discountAmount: discount,
      total: tot,
      totalItems: count,
    }
  }, [selectedItems, productMap, discountPercent])

  // Check if bundle requirements are met
  const min = minItems || 1
  const meetsMinimum = totalItems >= min
  const exceedsMaximum = maxItems ? totalItems > maxItems : false
  const canAddToCart = meetsMinimum && !exceedsMaximum && !isLoading

  return (
    <Card className={cn("sticky top-4", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Bundle</span>
          <Badge variant="secondary" className="ml-2 text-green-600">
            <Tag className="mr-1 h-3 w-3" />
            {discountPercent}% Off
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selected Items */}
        {itemsWithDetails.length > 0 ? (
          <div className="space-y-3">
            {itemsWithDetails.map((item) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={item.product.image}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.product.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity} x ${item.effectivePrice.toFixed(2)}
                  </p>
                </div>
                <span className="text-sm font-medium">
                  ${item.lineTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No items selected yet.</p>
            <p className="text-xs mt-1">
              Select at least {min} item{min !== 1 ? "s" : ""} to build your bundle.
            </p>
          </div>
        )}

        {/* Pricing Summary */}
        {itemsWithDetails.length > 0 && (
          <>
            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center">
                  <Tag className="mr-1 h-3 w-3" />
                  Bundle Discount ({discountPercent}%)
                </span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {/* Savings Callout */}
              <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-950">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  You save ${discountAmount.toFixed(2)} with this bundle!
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {/* Status Messages */}
        {!meetsMinimum && totalItems > 0 && (
          <p className="w-full text-center text-sm text-muted-foreground">
            Add {min - totalItems} more item{min - totalItems !== 1 ? "s" : ""} to complete your bundle
          </p>
        )}

        {exceedsMaximum && (
          <p className="w-full text-center text-sm text-destructive">
            Remove {totalItems - (maxItems || 0)} item{(totalItems - (maxItems || 0)) !== 1 ? "s" : ""} - maximum is {maxItems}
          </p>
        )}

        {/* Add to Cart Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={onAddToCart}
          disabled={!canAddToCart}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding to Cart...
            </>
          ) : meetsMinimum ? (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add Bundle to Cart - ${total.toFixed(2)}
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Complete Your Bundle
            </>
          )}
        </Button>

        {meetsMinimum && !exceedsMaximum && (
          <p className="flex items-center justify-center gap-1 text-xs text-green-600">
            <Check className="h-3 w-3" />
            Bundle requirements met
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
