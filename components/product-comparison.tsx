"use client"

import { useState } from "react"
import { Product } from "@/types/product"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"

interface ProductComparisonProps {
  products: Product[]
  category: string
  filters?: {
    priceRange?: [number, number]
    certifications?: string[]
    sustainabilityScoreMin?: number
  }
}

export function ProductComparison({
  products,
  category,
  filters,
}: ProductComparisonProps) {
  const [sortBy, setSortBy] = useState<
    "sustainabilityScore" | "price" | "ranking" | "name"
  >("ranking")
  const [filterCertifications, setFilterCertifications] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Infinity])

  const filteredProducts = products
    .filter((product) => {
      if (filterCertifications.length > 0) {
        return product.certifications.some((cert) =>
          filterCertifications.includes(cert.name)
        )
      }
      return true
    })
    .filter(
      (product) =>
        product.price.amount >= priceRange[0] &&
        product.price.amount <= priceRange[1]
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "sustainabilityScore":
          return b.sustainabilityScore.overall - a.sustainabilityScore.overall
        case "price":
          return a.price.amount - b.price.amount
        case "ranking":
          return (a.ranking || Infinity) - (b.ranking || Infinity)
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Best {category} Comparison ({filteredProducts.length})
        </h2>
        <div className="flex items-center gap-4">
          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy(
                value as "sustainabilityScore" | "price" | "ranking" | "name"
              )
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ranking">Best Overall</SelectItem>
              <SelectItem value="sustainabilityScore">Eco Score</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Product</TableHead>
            <TableHead>Eco Score</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Key Features</TableHead>
            <TableHead>Certifications</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-start gap-2">
                  {product.sponsored && (
                    <Badge variant="secondary">Sponsored</Badge>
                  )}
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      by {product.manufacturer.name}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <StarRating
                    rating={product.sustainabilityScore.overall}
                    maxRating={10}
                  />
                  <span className="text-sm text-muted-foreground">
                    {product.sustainabilityScore.overall}/10
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    ${product.price.amount.toFixed(2)}
                  </span>
                  {product.price.unit && (
                    <span className="text-sm text-muted-foreground">
                      {product.price.unit}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <ul className="list-inside list-disc text-sm">
                  {product.features.slice(0, 3).map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {product.certifications.map((cert) => (
                    <Badge key={cert.name} variant="outline">
                      {cert.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="default"
                  onClick={() => window.open(product.affiliateUrl, "_blank")}
                >
                  View Deal
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          Last updated: {new Date().toLocaleDateString()}. Prices and availability
          may vary.
        </p>
        <p>
          Note: Some links are affiliate links. We may earn a commission if you
          make a purchase.
        </p>
      </div>
    </div>
  )
}
