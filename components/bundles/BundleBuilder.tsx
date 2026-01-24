"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { BundleProgress } from "./BundleProgress"
import { BundleProductSelector } from "./BundleProductSelector"
import { BundleSummary } from "./BundleSummary"
import { toast } from "sonner"

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

interface BundleProduct {
  id: string
  productId: string
  product: Product
  isRequired: boolean
  isDefault: boolean
  maxQuantity: number
  effectivePrice: number
}

interface Bundle {
  id: string
  title: string
  slug: string
  description: string | null
  image: string | null
  discountPercent: number
  isCustomizable: boolean
  minItems: number | null
  maxItems: number | null
  category: string | null
  products: BundleProduct[]
  availableProducts: Product[]
  pricing: {
    basePrice: number
    discountedPrice: number
    savings: number
    discountPercent: number
  }
}

interface SelectedItem {
  productId: string
  quantity: number
}

interface BundleBuilderProps {
  bundle: Bundle
}

export function BundleBuilder({ bundle }: BundleBuilderProps) {
  const router = useRouter()
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Initialize with default and required items
  useEffect(() => {
    const initialItems: SelectedItem[] = bundle.products
      .filter((bp) => bp.isRequired || bp.isDefault)
      .map((bp) => ({
        productId: bp.productId,
        quantity: 1,
      }))

    setSelectedItems(initialItems)
  }, [bundle.products])

  // Calculate total items
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0)

  // Get all products for the summary
  const allProducts = [
    ...bundle.products.map((bp) => bp.product),
    ...bundle.availableProducts,
  ]

  // Handle add to cart
  const handleAddToCart = async () => {
    // Validate minimum items
    if (bundle.minItems && totalItems < bundle.minItems) {
      toast.error(`Please select at least ${bundle.minItems} items`)
      return
    }

    // Validate maximum items
    if (bundle.maxItems && totalItems > bundle.maxItems) {
      toast.error(`Maximum ${bundle.maxItems} items allowed`)
      return
    }

    setIsAddingToCart(true)

    try {
      const response = await fetch(`/api/bundles/${bundle.slug}/add-to-cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selectedItems }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add bundle to cart")
      }

      toast.success(data.message || "Bundle added to cart!")

      // Optionally refresh or redirect
      router.refresh()
    } catch (error) {
      console.error("Error adding bundle to cart:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add bundle to cart")
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Bundle Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          {/* Bundle Image */}
          {bundle.image && (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl lg:aspect-square lg:w-1/3">
              <Image
                src={bundle.image}
                alt={bundle.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
              <Badge className="absolute left-4 top-4 bg-green-600 px-4 py-1 text-lg text-white">
                Save {bundle.discountPercent}%
              </Badge>
            </div>
          )}

          {/* Bundle Info */}
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold lg:text-4xl">{bundle.title}</h1>

            {bundle.description && (
              <p className="mb-4 text-lg text-muted-foreground">
                {bundle.description}
              </p>
            )}

            {/* Bundle Type Info */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Badge variant="secondary">
                {bundle.isCustomizable ? "Build Your Own" : "Fixed Bundle"}
              </Badge>
              {bundle.category && (
                <Badge variant="outline">{bundle.category}</Badge>
              )}
              {bundle.minItems && (
                <Badge variant="outline">
                  Pick {bundle.minItems}
                  {bundle.maxItems && bundle.maxItems !== bundle.minItems
                    ? ` - ${bundle.maxItems}`
                    : ""}{" "}
                  items
                </Badge>
              )}
            </div>

            {/* Progress Indicator */}
            {bundle.isCustomizable && (
              <BundleProgress
                currentItems={totalItems}
                minItems={bundle.minItems}
                maxItems={bundle.maxItems}
                className="mb-6"
              />
            )}

            {/* Pricing Preview */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">
                  ${bundle.pricing.discountedPrice.toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  ${bundle.pricing.basePrice.toFixed(2)}
                </span>
                <span className="text-lg font-medium text-green-600">
                  Save ${bundle.pricing.savings.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on default selection. Your total may vary.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Product Selector */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">
            {bundle.isCustomizable
              ? "Choose Your Products"
              : "Products Included"}
          </h2>

          <BundleProductSelector
            bundleProducts={bundle.products}
            availableProducts={bundle.isCustomizable ? bundle.availableProducts : []}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            maxItems={bundle.maxItems}
          />
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <BundleSummary
            bundleTitle={bundle.title}
            discountPercent={bundle.discountPercent}
            selectedItems={selectedItems}
            products={allProducts}
            minItems={bundle.minItems}
            maxItems={bundle.maxItems}
            isLoading={isAddingToCart}
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>
    </div>
  )
}
