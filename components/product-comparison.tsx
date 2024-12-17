"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import Image from "next/image"
import { FadeIn, ScaleIn } from "./ui/animations"
import { ProductWithRelations } from "@/app/admin/products/columns"

interface ProductComparisonProps {
  products: ProductWithRelations[]
}

export function ProductComparison({ products }: ProductComparisonProps) {
  const [selectedProducts, setSelectedProducts] = useState<ProductWithRelations[]>([])
  const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null)

  const addProduct = (product: ProductWithRelations) => {
    if (selectedProducts.length < 3) {
      setSelectedProducts([...selectedProducts, product])
    }
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId))
  }

  const getEcoScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500"
    if (score >= 6) return "text-yellow-500"
    return "text-red-500"
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="p-6">
      <ScaleIn>
        <h2 className="mb-6 text-center text-2xl font-bold">
          Compare Sustainable Products
        </h2>
      </ScaleIn>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {selectedProducts.map((product, index) => (
          <motion.div
            key={product.id}
            variants={itemVariants}
            layoutId={`product-${product.id}`}
            className="relative"
          >
            <Card className="h-full p-4">
              <motion.button
                className="absolute right-2 top-2 rounded-full bg-gray-100 p-1 hover:bg-gray-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeProduct(product.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </motion.button>

              <div className="relative mb-4 aspect-square overflow-hidden rounded-lg">
                {product.images?.[0]?.url && (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 * index }}
              >
                <h3 className="mb-2 text-lg font-semibold">{product.name}</h3>
                <div className="mb-4 flex items-center gap-2">
                  <span className="font-medium">${product.price?.amount}</span>
                  {product.sustainabilityScore && (
                    <Badge
                      variant="secondary"
                      className={getEcoScoreColor(product.sustainabilityScore.overall)}
                    >
                      Eco Score: {product.sustainabilityScore.overall}
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium">Features</h4>
                    <ul className="space-y-1">
                      {product.features?.map((feature) => (
                        <motion.li
                          key={feature}
                          className={`text-sm ${
                            highlightedFeature === feature
                              ? "font-medium text-primary"
                              : ""
                          }`}
                          whileHover={{
                            x: 5,
                            transition: { type: "spring", stiffness: 300 },
                          }}
                          onHoverStart={() => setHighlightedFeature(feature)}
                          onHoverEnd={() => setHighlightedFeature(null)}
                        >
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium">Sustainability</h4>
                    <ul className="space-y-1">
                      <motion.li
                        className="text-sm text-green-600"
                        whileHover={{
                          x: 5,
                          transition: { type: "spring", stiffness: 300 },
                        }}
                      >
                        Carbon Footprint: {product.sustainabilityScore?.carbonFootprint}/10
                      </motion.li>
                      <motion.li
                        className="text-sm text-green-600"
                        whileHover={{
                          x: 5,
                          transition: { type: "spring", stiffness: 300 },
                        }}
                      >
                        Material Sourcing: {product.sustainabilityScore?.materialSourcing}/10
                      </motion.li>
                      <motion.li
                        className="text-sm text-green-600"
                        whileHover={{
                          x: 5,
                          transition: { type: "spring", stiffness: 300 },
                        }}
                      >
                        Manufacturing: {product.sustainabilityScore?.manufacturingProcess}/10
                      </motion.li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {selectedProducts.length < 3 && (
        <FadeIn>
          <div className="mt-6">
            <h3 className="mb-4 text-lg font-medium">Add Products to Compare</h3>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            >
              {products
                .filter((p) => !selectedProducts.find((sp) => sp.id === p.id))
                .map((product) => (
                  <motion.div
                    key={product.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      className="flex h-full w-full flex-col items-center gap-2 p-4"
                      onClick={() => addProduct(product)}
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-full">
                        {product.images?.[0]?.url && (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="text-center text-sm font-medium">
                        {product.name}
                      </span>
                    </Button>
                  </motion.div>
                ))}
            </motion.div>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
