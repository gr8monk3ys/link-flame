"use client"

import * as React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Eye, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuickViewProduct } from "./QuickViewModal"

const QuickViewModal = dynamic(
  () => import("./QuickViewModal").then((mod) => mod.QuickViewModal),
  { ssr: false, loading: () => null }
)

interface QuickViewTriggerProps {
  productId: string
  /** Product data if already available (avoids pre-fetch) */
  product?: QuickViewProduct
  /** Custom class name for the trigger button */
  className?: string
  /** Whether to show the trigger on hover only (desktop) or always (mobile) */
  showOnHover?: boolean
  /** Size of the trigger button */
  size?: "sm" | "md" | "lg"
  /** Custom label for accessibility */
  label?: string
  /** Called when the modal opens */
  onOpen?: () => void
  /** Called when the modal closes */
  onClose?: () => void
}

export function QuickViewTrigger({
  productId,
  product: initialProduct,
  className,
  showOnHover = true,
  size = "md",
  label,
  onOpen,
  onClose,
}: QuickViewTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [product, setProduct] = useState<QuickViewProduct | null>(initialProduct || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPrefetching, setIsPrefetching] = useState(false)
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasPrefetchedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Pre-fetch product data on hover for instant open
  const prefetchProduct = useCallback(async () => {
    if (product || hasPrefetchedRef.current || isPrefetching) return

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsPrefetching(true)
    hasPrefetchedRef.current = true

    try {
      const response = await fetch(`/api/products/${productId}`, {
        signal: abortControllerRef.current.signal,
      })
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error("Error prefetching product:", error)
      hasPrefetchedRef.current = false // Allow retry on next hover
    } finally {
      setIsPrefetching(false)
    }
  }, [productId, product, isPrefetching])

  // Handle mouse enter with debounced prefetch
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    // Start prefetch after a short delay to avoid unnecessary requests
    if (!product && !hasPrefetchedRef.current) {
      prefetchTimeoutRef.current = setTimeout(() => {
        prefetchProduct()
      }, 150)
    }
  }, [product, prefetchProduct])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current)
      prefetchTimeoutRef.current = null
    }
  }, [])

  // Fetch product data when opening if not already loaded
  const fetchProduct = useCallback(async () => {
    if (product) return

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        signal: abortControllerRef.current.signal,
      })
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      } else {
        throw new Error("Failed to fetch product")
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error("Error fetching product:", error)
    } finally {
      setIsLoading(false)
    }
  }, [productId, product])

  // Handle open modal
  const handleOpen = useCallback(async () => {
    if (!product) {
      await fetchProduct()
    }
    setIsOpen(true)
    onOpen?.()
  }, [product, fetchProduct, onOpen])

  // Handle modal open change
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)
      if (!open) {
        onClose?.()
      }
    },
    [onClose]
  )

  // Handle keyboard interaction
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        handleOpen()
      }
    },
    [handleOpen]
  )

  // Cleanup timeout and abort controller on unmount
  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Update product if initialProduct changes
  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct)
    }
  }, [initialProduct])

  // Size variants
  const sizeClasses = {
    sm: "size-8 p-1.5",
    md: "size-10 p-2",
    lg: "size-12 p-2.5",
  }

  const iconSizes = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  }

  // Determine visibility based on hover state and settings
  const isVisible = showOnHover ? isHovered : true

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        disabled={isLoading}
        className={cn(
          // Base styles
          "group relative flex items-center justify-center rounded-full",
          "bg-white/90 shadow-md backdrop-blur-sm",
          "border border-gray-200",
          "transition-all duration-200 ease-in-out",
          // Hover/Focus states
          "hover:scale-105 hover:bg-white hover:shadow-lg",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          // Active state
          "active:scale-95",
          // Visibility transition
          showOnHover && [
            "pointer-events-none translate-y-1 opacity-0",
            "group-hover/card:pointer-events-auto group-hover/card:translate-y-0 group-hover/card:opacity-100",
          ],
          // Size
          sizeClasses[size],
          // Disabled state
          isLoading && "cursor-wait",
          className
        )}
        aria-label={label || `Quick view ${product?.title || "product"}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {isLoading ? (
          <Loader2 className={cn(iconSizes[size], "animate-spin text-gray-600")} />
        ) : (
          <Eye
            className={cn(
              iconSizes[size],
              "text-gray-600 transition-colors group-hover:text-green-600"
            )}
          />
        )}

        {/* Tooltip */}
        <span
          className={cn(
            "absolute -bottom-8 left-1/2 -translate-x-1/2",
            "whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white",
            "pointer-events-none opacity-0 transition-opacity",
            "group-hover:opacity-100"
          )}
          role="tooltip"
        >
          Quick View
        </span>
      </button>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        open={isOpen}
        onOpenChange={handleOpenChange}
      />
    </>
  )
}

/**
 * Wrapper component that provides hover detection for a card container
 * This is used to control visibility of the QuickViewTrigger based on card hover
 */
interface QuickViewCardWrapperProps {
  children: React.ReactNode
  className?: string
}

export function QuickViewCardWrapper({ children, className }: QuickViewCardWrapperProps) {
  return (
    <div className={cn("group/card relative", className)}>
      {children}
    </div>
  )
}

export default QuickViewTrigger
