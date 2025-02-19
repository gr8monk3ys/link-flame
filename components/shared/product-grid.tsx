"use client"

import { useState } from "react"
import ProductCard from "@/components/ui/product-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TopPickProduct } from "@/components/ui/product-card"

// Mock data - in production, this would come from your API
const mockProducts: TopPickProduct[] = [
  {
    id: "1",
    title: "Bamboo Utensil Set",
    description: "Reusable bamboo utensils for sustainable dining on-the-go",
    image: "/products/bamboo-utensils.jpg",
    url: "/product/bamboo-utensil-set"
  },
  {
    id: "2",
    title: "Smart EV Charger",
    description: "Level 2 home EV charger with smart scheduling",
    image: "/products/ev-charger.jpg",
    url: "/product/smart-ev-charger"
  },
  {
    id: "3",
    title: "Solar Power Bank",
    description: "Portable solar charger for sustainable device charging",
    image: "/products/solar-powerbank.jpg",
    url: "/product/solar-power-bank"
  },
  {
    id: "4",
    title: "Reusable Produce Bags",
    description: "Mesh bags for plastic-free grocery shopping",
    image: "/products/produce-bags.jpg",
    url: "/product/reusable-produce-bags"
  }
]

interface ProductGridProps {
  category?: string
  limit?: number
}

export function ProductGrid({ category, limit }: ProductGridProps) {
  const [sortBy, setSortBy] = useState("recommended")

  // Filter products by category if specified
  let products = mockProducts

  // Sort products based on selection
  products = [...products].sort((a, b) => {
    switch (sortBy) {
      case "title-asc":
        return a.title.localeCompare(b.title)
      case "title-desc":
        return b.title.localeCompare(a.title)
      default:
        return 0
    }
  })

  // Apply limit if specified
  if (limit) {
    products = products.slice(0, limit)
  }

  return (
    <div className="space-y-4">
      {!limit && (
        <div className="flex justify-end">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="title-asc">Title: A to Z</SelectItem>
              <SelectItem value="title-desc">Title: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} variant="topPick" />
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-center text-muted-foreground">
          No products found in this category.
        </p>
      )}
    </div>
  )
}
