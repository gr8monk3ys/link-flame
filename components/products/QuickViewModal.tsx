"use client"

import * as React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, Minus, Plus, Heart, Eye, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { cn, formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/lib/providers/CartProvider"
import { useSavedItems } from "@/hooks/useSavedItems"
import { VariantSelector, ProductVariant } from "@/components/products/variant-selector"

// Stock status thresholds
const LOW_STOCK_THRESHOLD = 5

function getStockBadge(inventory: number): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } | null {
  if (inventory <= 0) {
    return { label: "Out of Stock", variant: "destructive" }
  }
  if (inventory <= LOW_STOCK_THRESHOLD) {
    return { label: `Only ${inventory} left`, variant: "secondary" }
  }
  return null
}

export interface QuickViewProduct {
  id: string
  title: string
  description: string | null
  price: number
  salePrice: number | null
  image: string
  images?: string[]
  category: string
  inventory: number
  hasVariants: boolean
  variants: ProductVariant[]
  reviews: Array<{ rating: number }>
}

interface QuickViewModalProps {
  product: QuickViewProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Image Gallery Component
function ImageGallery({
  images,
  productTitle,
  selectedIndex,
  onIndexChange,
}: {
  images: string[]
  productTitle: string
  selectedIndex: number
  onIndexChange: (index: number) => void
}) {
  const hasMultipleImages = images.length > 1

  const handlePrevious = useCallback(() => {
    onIndexChange(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1)
  }, [selectedIndex, images.length, onIndexChange])

  const handleNext = useCallback(() => {
    onIndexChange(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1)
  }, [selectedIndex, images.length, onIndexChange])

  return (
    <div className="relative flex flex-col gap-3">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={images[selectedIndex]}
          alt={productTitle}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 400px"
          priority
        />
        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Next image"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onIndexChange(index)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                selectedIndex === index
                  ? "border-green-600 ring-1 ring-green-600"
                  : "border-transparent hover:border-gray-300"
              )}
              aria-label={`View image ${index + 1}`}
              aria-current={selectedIndex === index ? "true" : "false"}
            >
              <Image
                src={image}
                alt={`${productTitle} thumbnail ${index + 1}`}
                fill
                className="object-cover object-center"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Quantity Selector Component
function QuantitySelector({
  quantity,
  onQuantityChange,
  max = 99,
  disabled = false,
}: {
  quantity: number
  onQuantityChange: (quantity: number) => void
  max?: number
  disabled?: boolean
}) {
  const handleDecrement = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1)
    }
  }

  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <label className="sr-only">Quantity</label>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={disabled || quantity <= 1}
        className="size-9"
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </Button>
      <input
        type="number"
        min={1}
        max={max}
        value={quantity}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10)
          if (!isNaN(val) && val >= 1 && val <= max) {
            onQuantityChange(val)
          }
        }}
        disabled={disabled}
        className="h-9 w-14 rounded-md border text-center focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        aria-label="Quantity"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={disabled || quantity >= max}
        className="size-9"
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}

// Star Rating Display
function StarRatingDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center" role="img" aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars`}>
        {[0, 1, 2, 3, 4].map((star) => (
          <svg
            key={star}
            className={cn(
              "size-4",
              star < Math.round(rating) ? "text-yellow-400" : "text-gray-300"
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </div>
  )
}

export function QuickViewModal({ product, open, onOpenChange }: QuickViewModalProps) {
  const { data: session } = useSession()
  const { addItemToCart, isLoading: cartLoading } = useCart()
  const { isItemSaved, toggleSaveItem, isLoading: savedItemsLoading } = useSavedItems()

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)

  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setQuantity(1)
      setSelectedImageIndex(0)
      if (product.hasVariants && product.variants.length > 0) {
        const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0]
        setSelectedVariant(defaultVariant)
      } else {
        setSelectedVariant(null)
      }
    }
  }, [product])

  // Update image when variant changes
  useEffect(() => {
    if (selectedVariant?.image) {
      setSelectedImageIndex(0)
    }
  }, [selectedVariant])

  const handleVariantChange = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant)
  }, [])

  // Computed values
  const displayPrice = selectedVariant?.price ?? selectedVariant?.salePrice ?? product?.salePrice ?? product?.price ?? 0
  const originalPrice = selectedVariant?.price ?? product?.price ?? 0
  const displayImage = selectedVariant?.image ?? product?.image ?? ""
  const displayInventory = selectedVariant?.inventory ?? product?.inventory ?? 0
  const isOnSale = (selectedVariant?.salePrice || product?.salePrice) && displayPrice < originalPrice
  const stockBadge = getStockBadge(displayInventory)
  const isOutOfStock = displayInventory <= 0
  const needsVariant = product?.hasVariants && !selectedVariant

  // Build images array for gallery
  const images = React.useMemo(() => {
    if (!product) return []
    const imageArray: string[] = []
    if (displayImage) imageArray.push(displayImage)
    if (product.images) {
      product.images.forEach((img) => {
        if (img !== displayImage && !imageArray.includes(img)) {
          imageArray.push(img)
        }
      })
    }
    if (imageArray.length === 0 && product.image) {
      imageArray.push(product.image)
    }
    return imageArray
  }, [product, displayImage])

  // Average rating calculation
  const averageRating = React.useMemo(() => {
    if (!product?.reviews.length) return null
    return product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
  }, [product])

  // Handle Add to Cart
  const handleAddToCart = async () => {
    if (!product) return

    if (isOutOfStock) {
      toast.error("This product is out of stock")
      return
    }

    if (needsVariant) {
      toast.error("Please select a size/color option")
      return
    }

    if (!session) {
      toast.error("Please sign in to add items to cart")
      return
    }

    setIsAddingToCart(true)
    try {
      // Build variant description for display
      let variantDescription = ""
      if (selectedVariant) {
        const parts = [selectedVariant.size, selectedVariant.color, selectedVariant.material].filter(Boolean)
        if (parts.length > 0) {
          variantDescription = ` (${parts.join(", ")})`
        }
      }

      await addItemToCart({
        id: product.id,
        title: product.title + variantDescription,
        price: displayPrice,
        image: displayImage,
        quantity: quantity,
        variantId: selectedVariant?.id || null,
        variant: selectedVariant
          ? {
              id: selectedVariant.id,
              sku: selectedVariant.sku,
              size: selectedVariant.size,
              color: selectedVariant.color,
              colorCode: selectedVariant.colorCode,
              material: selectedVariant.material,
            }
          : null,
      })
    } catch (error) {
      console.error("Error adding product to cart:", error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Handle Add to Wishlist
  const handleToggleWishlist = async () => {
    if (!product) return

    if (!session) {
      toast.error("Please sign in to save items")
      return
    }

    setIsTogglingWishlist(true)
    try {
      await toggleSaveItem({
        id: product.id,
        title: product.title,
        price: displayPrice,
        image: displayImage,
        quantity: 1,
      })
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    } finally {
      setIsTogglingWishlist(false)
    }
  }

  const isWishlisted = product ? isItemSaved(product.id) : false

  if (!product) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />

        {/* Content */}
        <DialogPrimitive.Content
          className={cn(
            // Base styles
            "fixed z-50 bg-background shadow-xl focus:outline-none",
            // Desktop: Centered modal
            "sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:w-[95vw] sm:max-w-4xl",
            // Mobile: Bottom sheet, desktop: centered modal
            "inset-x-0 bottom-0 sm:inset-auto",
            "max-h-[95vh] rounded-t-xl sm:max-h-[90vh] sm:rounded-lg",
            // Animations
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
            "sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]",
            "sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
            "duration-300"
          )}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            closeButtonRef.current?.focus()
          }}
          aria-describedby="quick-view-description"
        >
          {/* Mobile drag handle indicator */}
          <div className="flex justify-center py-2 sm:hidden">
            <div className="h-1 w-12 rounded-full bg-gray-300" />
          </div>

          {/* Close button */}
          <DialogPrimitive.Close
            ref={closeButtonRef}
            className={cn(
              "absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-md",
              "transition-colors hover:bg-gray-100",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
            aria-label="Close quick view"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>

          {/* Scrollable content */}
          <div className="max-h-[calc(95vh-2rem)] overflow-y-auto p-4 sm:max-h-[calc(90vh-2rem)] sm:p-6">
            {/* Screen reader announcement */}
            <div className="sr-only" role="status" aria-live="polite">
              Quick view for {product.title}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
              {/* Left Column: Image Gallery */}
              <div>
                <ImageGallery
                  images={images}
                  productTitle={product.title}
                  selectedIndex={selectedImageIndex}
                  onIndexChange={setSelectedImageIndex}
                />
              </div>

              {/* Right Column: Product Details */}
              <div className="flex flex-col">
                {/* Title and Category */}
                <div>
                  <p className="text-sm uppercase tracking-wide text-muted-foreground">
                    {product.category}
                  </p>
                  <DialogPrimitive.Title className="mt-1 text-2xl font-bold text-gray-900">
                    {product.title}
                  </DialogPrimitive.Title>
                </div>

                {/* Rating */}
                {averageRating && (
                  <div className="mt-3">
                    <StarRatingDisplay rating={averageRating} count={product.reviews.length} />
                  </div>
                )}

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(displayPrice)}
                  </span>
                  {isOnSale && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                  {isOnSale && (
                    <Badge variant="destructive" className="ml-2">
                      Sale
                    </Badge>
                  )}
                </div>

                {/* Stock Badge */}
                {stockBadge && (
                  <div className="mt-2">
                    <Badge variant={stockBadge.variant}>{stockBadge.label}</Badge>
                  </div>
                )}

                {/* Description */}
                <DialogPrimitive.Description
                  id="quick-view-description"
                  className="mt-4 line-clamp-3 text-sm text-gray-600"
                >
                  {product.description || "No description available."}
                </DialogPrimitive.Description>

                {/* Variant Selector */}
                {product.hasVariants && product.variants.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <VariantSelector
                      variants={product.variants}
                      selectedVariant={selectedVariant}
                      onVariantChange={handleVariantChange}
                      basePrice={product.price}
                      baseImage={product.image}
                    />
                  </div>
                )}

                {/* Quantity and Actions */}
                <div className="mt-6 space-y-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Quantity:</span>
                    <QuantitySelector
                      quantity={quantity}
                      onQuantityChange={setQuantity}
                      max={Math.min(displayInventory, 99)}
                      disabled={isOutOfStock}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {/* Add to Cart */}
                    <Button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock || needsVariant || isAddingToCart || cartLoading}
                      className="h-12 flex-1 bg-green-600 text-base hover:bg-green-700"
                      size="lg"
                    >
                      {isAddingToCart ? (
                        <>
                          <Loader2 className="mr-2 size-5 animate-spin" />
                          Adding...
                        </>
                      ) : isOutOfStock ? (
                        "Out of Stock"
                      ) : needsVariant ? (
                        "Select Options"
                      ) : (
                        "Add to Cart"
                      )}
                    </Button>

                    {/* Add to Wishlist */}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleToggleWishlist}
                      disabled={isTogglingWishlist || savedItemsLoading}
                      className={cn(
                        "h-12 px-4",
                        isWishlisted && "border-red-500 text-red-500 hover:bg-red-50"
                      )}
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        className={cn("size-5", isWishlisted && "fill-current")}
                      />
                      <span className="ml-2 sm:hidden lg:inline">
                        {isWishlisted ? "Saved" : "Save"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* View Full Details Link */}
                <div className="mt-6 border-t pt-4">
                  <Link
                    href={`/products/${product.id}`}
                    onClick={() => onOpenChange(false)}
                    className="inline-flex items-center rounded text-sm font-medium text-green-600 hover:text-green-700 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <Eye className="mr-2 size-4" />
                    View Full Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default QuickViewModal
