"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"

export interface ProductVariant {
  id: string
  sku: string | null
  size: string | null
  color: string | null
  colorCode: string | null
  material: string | null
  price: number | null
  salePrice: number | null
  image: string | null
  inventory: number
  isDefault: boolean
  sortOrder: number
}

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onVariantChange: (variant: ProductVariant) => void
  basePrice: number
  baseImage: string
}

// Get unique values for a variant attribute
function getUniqueOptions<K extends keyof ProductVariant>(
  variants: ProductVariant[],
  key: K
): Array<{ value: ProductVariant[K]; variant: ProductVariant }> {
  const seen = new Set<ProductVariant[K]>()
  const options: Array<{ value: ProductVariant[K]; variant: ProductVariant }> = []

  for (const variant of variants) {
    const value = variant[key]
    if (value !== null && !seen.has(value)) {
      seen.add(value)
      options.push({ value, variant })
    }
  }

  return options
}

// Check if a size/color/material combination exists in variants
function findMatchingVariant(
  variants: ProductVariant[],
  size: string | null,
  color: string | null,
  material: string | null
): ProductVariant | null {
  return variants.find(v =>
    (size === null || v.size === size) &&
    (color === null || v.color === color) &&
    (material === null || v.material === material)
  ) || null
}

export function VariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
  basePrice,
  baseImage,
}: VariantSelectorProps) {
  // Get available options for each attribute
  const sizes = getUniqueOptions(variants, "size")
  const colors = getUniqueOptions(variants, "color")
  const materials = getUniqueOptions(variants, "material")

  // Track selected attributes separately for better UX
  const [selectedSize, setSelectedSize] = useState<string | null>(
    selectedVariant?.size || null
  )
  const [selectedColor, setSelectedColor] = useState<string | null>(
    selectedVariant?.color || null
  )
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(
    selectedVariant?.material || null
  )

  // Update selected variant when attributes change
  useEffect(() => {
    const matchingVariant = findMatchingVariant(
      variants,
      selectedSize,
      selectedColor,
      selectedMaterial
    )
    if (matchingVariant && matchingVariant.id !== selectedVariant?.id) {
      onVariantChange(matchingVariant)
    }
  }, [selectedSize, selectedColor, selectedMaterial, variants, selectedVariant, onVariantChange])

  // Check if a specific option is available (has stock)
  const isOptionAvailable = (key: "size" | "color" | "material", value: string): boolean => {
    const filters: Partial<Record<"size" | "color" | "material", string | null>> = {}

    if (key !== "size" && selectedSize) filters.size = selectedSize
    if (key !== "color" && selectedColor) filters.color = selectedColor
    if (key !== "material" && selectedMaterial) filters.material = selectedMaterial
    filters[key] = value

    const matchingVariant = variants.find(v =>
      (!filters.size || v.size === filters.size) &&
      (!filters.color || v.color === filters.color) &&
      (!filters.material || v.material === filters.material)
    )

    return matchingVariant ? matchingVariant.inventory > 0 : false
  }

  const hasSizes = sizes.length > 0
  const hasColors = colors.length > 0
  const hasMaterials = materials.length > 0

  if (!hasSizes && !hasColors && !hasMaterials) {
    return null // No variants to select
  }

  return (
    <div className="space-y-6">
      {/* Size Selector */}
      {hasSizes && (
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Size</h3>
            {selectedSize && (
              <span className="text-sm text-gray-500">{selectedSize}</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map(({ value, variant }) => {
              const isSelected = selectedSize === value
              const isAvailable = isOptionAvailable("size", value as string)

              return (
                <button
                  key={value as string}
                  type="button"
                  onClick={() => setSelectedSize(value as string)}
                  disabled={!isAvailable}
                  className={`
                    relative min-w-[3rem] px-4 py-2 text-sm font-medium rounded-md border
                    transition-all duration-150
                    ${isSelected
                      ? "border-green-600 bg-green-600 text-white"
                      : isAvailable
                        ? "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                        : "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                    }
                    ${!isAvailable && !isSelected ? "line-through" : ""}
                  `}
                >
                  {value as string}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Color Selector */}
      {hasColors && (
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Color</h3>
            {selectedColor && (
              <span className="text-sm text-gray-500">{selectedColor}</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map(({ value, variant }) => {
              const isSelected = selectedColor === value
              const isAvailable = isOptionAvailable("color", value as string)
              const colorCode = variant.colorCode

              return (
                <button
                  key={value as string}
                  type="button"
                  onClick={() => setSelectedColor(value as string)}
                  disabled={!isAvailable}
                  className={`
                    relative flex items-center justify-center rounded-full
                    ${isSelected ? "ring-2 ring-offset-2 ring-green-600" : ""}
                    ${!isAvailable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                  `}
                  title={value as string}
                >
                  {colorCode ? (
                    <span
                      className="h-8 w-8 rounded-full border border-gray-300"
                      style={{ backgroundColor: colorCode }}
                    >
                      {isSelected && (
                        <Check className={`h-5 w-5 m-1.5 ${isLightColor(colorCode) ? "text-gray-800" : "text-white"}`} />
                      )}
                    </span>
                  ) : (
                    <span className={`
                      px-3 py-1 text-sm rounded-full border
                      ${isSelected
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                      }
                    `}>
                      {value as string}
                    </span>
                  )}
                  {!isAvailable && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-px w-8 bg-gray-400 rotate-45 absolute" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Material Selector */}
      {hasMaterials && (
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Material</h3>
            {selectedMaterial && (
              <span className="text-sm text-gray-500">{selectedMaterial}</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {materials.map(({ value, variant }) => {
              const isSelected = selectedMaterial === value
              const isAvailable = isOptionAvailable("material", value as string)

              return (
                <button
                  key={value as string}
                  type="button"
                  onClick={() => setSelectedMaterial(value as string)}
                  disabled={!isAvailable}
                  className={`
                    relative px-4 py-2 text-sm font-medium rounded-md border
                    transition-all duration-150
                    ${isSelected
                      ? "border-green-600 bg-green-600 text-white"
                      : isAvailable
                        ? "border-gray-300 bg-white text-gray-900 hover:border-gray-400"
                        : "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                    }
                    ${!isAvailable && !isSelected ? "line-through" : ""}
                  `}
                >
                  {value as string}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Variant SKU (if available) */}
      {selectedVariant?.sku && (
        <p className="text-xs text-gray-500">
          SKU: {selectedVariant.sku}
        </p>
      )}
    </div>
  )
}

// Helper to determine if a color is light (for text contrast)
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "")
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}
