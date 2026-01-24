"use client"

import { useMemo, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Minus, Plus, Lock } from "lucide-react"

interface Product {
  id: string
  title: string
  description?: string | null
  price: number
  salePrice: number | null
  image: string
  category: string
  inventory: number
}

interface BundleProductItem {
  productId: string
  product: Product
  isRequired: boolean
  isDefault: boolean
  maxQuantity: number
}

interface SelectedItem {
  productId: string
  quantity: number
}

interface BundleProductSelectorProps {
  bundleProducts: BundleProductItem[]
  availableProducts?: Product[]
  selectedItems: SelectedItem[]
  onSelectionChange: (items: SelectedItem[]) => void
  maxItems?: number | null
  className?: string
}

export function BundleProductSelector({
  bundleProducts,
  availableProducts = [],
  selectedItems,
  onSelectionChange,
  maxItems,
  className,
}: BundleProductSelectorProps) {
  // Combine bundle products and available products, avoiding duplicates
  // Memoize to prevent recalculation on every render
  const allProducts = useMemo(() => {
    const bundleProductIds = new Set(bundleProducts.map((bp) => bp.productId))
    return [
      ...bundleProducts.map((bp) => ({
        ...bp.product,
        isRequired: bp.isRequired,
        isDefault: bp.isDefault,
        maxQuantity: bp.maxQuantity,
      })),
      ...availableProducts
        .filter((p) => !bundleProductIds.has(p.id))
        .map((p) => ({
          ...p,
          isRequired: false,
          isDefault: false,
          maxQuantity: 1,
        })),
    ]
  }, [bundleProducts, availableProducts])

  // Get selection info for a product - memoize for stable reference
  const getSelection = useCallback(
    (productId: string): SelectedItem | undefined => {
      return selectedItems.find((item) => item.productId === productId)
    },
    [selectedItems]
  )

  // Calculate total selected items - memoize computed value
  const totalSelected = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems]
  )

  // Handle selection toggle - memoize callback
  const handleToggle = useCallback(
    (product: typeof allProducts[0]) => {
      const existing = selectedItems.find((item) => item.productId === product.id)

      if (existing) {
        // Remove from selection (if not required)
        if (!product.isRequired) {
          onSelectionChange(selectedItems.filter((item) => item.productId !== product.id))
        }
      } else {
        // Add to selection (if within max limit)
        if (!maxItems || totalSelected < maxItems) {
          onSelectionChange([
            ...selectedItems,
            { productId: product.id, quantity: 1 },
          ])
        }
      }
    },
    [selectedItems, maxItems, totalSelected, onSelectionChange]
  )

  // Handle quantity change - memoize callback
  const handleQuantityChange = useCallback(
    (productId: string, delta: number) => {
      const existing = selectedItems.find((item) => item.productId === productId)
      if (!existing) return

      const product = allProducts.find((p) => p.id === productId)
      if (!product) return

      const newQuantity = existing.quantity + delta

      // Check constraints
      if (newQuantity < 1) {
        if (!product.isRequired) {
          onSelectionChange(selectedItems.filter((item) => item.productId !== productId))
        }
        return
      }

      if (newQuantity > product.maxQuantity) return

      // Check max items
      if (delta > 0 && maxItems && totalSelected >= maxItems) return

      onSelectionChange(
        selectedItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      )
    },
    [selectedItems, allProducts, maxItems, totalSelected, onSelectionChange]
  )

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allProducts.map((product) => {
          const selection = getSelection(product.id)
          const isSelected = !!selection
          const effectivePrice = product.salePrice || product.price
          const isOutOfStock = product.inventory === 0
          const canAdd = !maxItems || totalSelected < maxItems || isSelected

          return (
            <Card
              key={product.id}
              className={cn(
                "overflow-hidden transition-all",
                isSelected && "ring-2 ring-primary",
                isOutOfStock && "opacity-50"
              )}
            >
              <CardContent className="p-0">
                <div className="flex gap-3 p-3">
                  {/* Product Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    {product.isRequired && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="line-clamp-1 text-sm font-medium">
                          {product.title}
                        </h4>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">
                            ${effectivePrice.toFixed(2)}
                          </span>
                          {product.salePrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selection Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(product)}
                        disabled={
                          isOutOfStock ||
                          product.isRequired ||
                          (!isSelected && !canAdd)
                        }
                        aria-label={`Select ${product.title}`}
                      />
                    </div>

                    {/* Badges */}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.isRequired && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {isOutOfStock && (
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    {isSelected && !product.isRequired && (
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(product.id, -1)}
                          disabled={selection!.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {selection!.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(product.id, 1)}
                          disabled={
                            selection!.quantity >= product.maxQuantity ||
                            (maxItems ? totalSelected >= maxItems : false)
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Max: {product.maxQuantity}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
