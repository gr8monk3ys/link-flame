"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  name: string
  image: string
  price: number
  rating: number
  energyRating: string
  features: string[]
  specs: {
    [key: string]: string | number
  }
}

interface ProductComparisonProps {
  products?: Product[]
}

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "EcoWash Pro 3000",
    image: "/images/products/washer1.jpg",
    price: 799.99,
    rating: 4.5,
    energyRating: "A+++",
    features: [
      "Smart load detection",
      "Eco wash cycle",
      "Steam cleaning",
      "WiFi connectivity"
    ],
    specs: {
      "Energy Usage": "175 kWh/year",
      "Water Usage": "9,000L/year",
      "Noise Level": "48 dB",
      "Capacity": "9 kg"
    }
  },
  {
    id: "2",
    name: "GreenCool Fridge X1",
    image: "/images/products/fridge1.jpg",
    price: 1299.99,
    rating: 4.8,
    energyRating: "A++",
    features: [
      "Dual cooling system",
      "Fresh zone compartment",
      "Energy saving mode",
      "Smart temperature control"
    ],
    specs: {
      "Energy Usage": "250 kWh/year",
      "Volume": "450L",
      "Noise Level": "40 dB",
      "Climate Class": "SN-T"
    }
  },
  {
    id: "3",
    name: "EcoDry Plus",
    image: "/images/products/dryer1.jpg",
    price: 699.99,
    rating: 4.3,
    energyRating: "A++",
    features: [
      "Heat pump technology",
      "Moisture sensors",
      "Quick dry option",
      "Anti-crease function"
    ],
    specs: {
      "Energy Usage": "200 kWh/year",
      "Capacity": "8 kg",
      "Noise Level": "65 dB",
      "Programs": "12"
    }
  }
]

export function ProductComparison({ products = defaultProducts }: ProductComparisonProps) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [showComparison, setShowComparison] = useState(false)

  const handleProductSelect = (product: Product) => {
    if (selectedProducts.length < 3) {
      setSelectedProducts([...selectedProducts, product])
    }
  }

  const handleProductRemove = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId))
  }

  const getCommonSpecs = () => {
    if (selectedProducts.length === 0) return []
    const specs = selectedProducts.map((p) => Object.keys(p.specs))
    return specs.reduce((a, b) => a.filter((c) => b.includes(c)))
  }

  return (
    <div className="space-y-8">
      {/* Selected Products Comparison */}
      {selectedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {selectedProducts.map((product) => (
              <Card key={product.id} className="flex-1 min-w-[250px]">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {product.energyRating}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleProductRemove(product.id)}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-2xl font-bold">${product.price}</p>
                    <div className="flex items-center">
                      {"★".repeat(Math.floor(product.rating))}
                      {"☆".repeat(5 - Math.floor(product.rating))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {product.rating}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedProducts.length >= 2 && (
            <div className="pt-4">
              <Button
                onClick={() => setShowComparison(!showComparison)}
                className="w-full"
              >
                {showComparison ? "Hide Comparison" : "Compare Features"}
              </Button>

              <AnimatePresence>
                {showComparison && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-4"
                  >
                    {/* Features Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getCommonSpecs().map((spec) => (
                        <div
                          key={spec}
                          className="glass-effect p-4 rounded-lg space-y-2"
                        >
                          <h4 className="font-medium">{spec}</h4>
                          <div className="space-y-1">
                            {selectedProducts.map((product) => (
                              <div
                                key={product.id}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-muted-foreground">
                                  {product.name}:
                                </span>
                                <span>{product.specs[spec]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Product Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products
          .filter((p) => !selectedProducts.find((sp) => sp.id === p.id))
          .map((product) => (
            <motion.div
              key={product.id}
              layout
              className="glass-effect p-4 rounded-lg hover-card-effect cursor-pointer"
              onClick={() => handleProductSelect(product)}
            >
              <h3 className="font-semibold mb-2">{product.name}</h3>
              <Badge variant="secondary" className="mb-4">
                {product.energyRating}
              </Badge>
              <p className="text-2xl font-bold mb-2">${product.price}</p>
              <div className="flex items-center mb-4">
                {"★".repeat(Math.floor(product.rating))}
                {"☆".repeat(5 - Math.floor(product.rating))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {product.rating}
                </span>
              </div>
              <div className="space-y-2">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <svg
                      className="w-4 h-4 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  )
}
