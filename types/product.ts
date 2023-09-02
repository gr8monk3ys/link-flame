export interface Certification {
  name: string
  description: string
  icon: string
  verificationUrl?: string
}

export interface SustainabilityScore {
  overall: number
  carbonFootprint: number
  materialSourcing: number
  manufacturingProcess: number
  packaging: number
  endOfLife: number
  socialImpact: number
}

export interface PricePoint {
  amount: number
  currency: string
  unit?: string // e.g., "per month", "per item"
  discountedFrom?: number
}

export interface Manufacturer {
  name: string
  sustainabilityCommitment: string
  certifications: Certification[]
  location: string
  website: string
}

export interface ProductReview {
  id: string
  rating: number
  author: string
  date: string
  verifiedPurchase: boolean
  content: string
  pros: string[]
  cons: string[]
}

/**
 * Detailed product type for sustainability-focused product reviews and comparisons.
 * This is used for editorial content, not the e-commerce Product model.
 *
 * For the actual e-commerce products, use the Prisma-generated Product type
 * or import from '@/types' which exports the database Product type.
 */
export interface DetailedProduct {
  id: string
  name: string
  slug: string
  category: string
  subCategory?: string
  manufacturer: Manufacturer
  description: string
  features: string[]
  specifications: Record<string, string>
  sustainabilityScore: SustainabilityScore
  price: PricePoint
  certifications: Certification[]
  pros: string[]
  cons: string[]
  reviews: ProductReview[]
  images: {
    main: string
    gallery: string[]
  }
  affiliateUrl?: string
  sponsored: boolean
  featured: boolean
  ranking?: number // Position in category rankings
  comparisonNotes?: string // Editorial notes for comparison tables
  lastUpdated: string
}

/**
 * Simple Product type matching Prisma database schema.
 * Use this for e-commerce functionality.
 */
export interface Product {
  id: string
  title: string
  description: string | null
  price: number
  salePrice: number | null
  image: string
  category: string
  createdAt?: Date
  updatedAt?: Date
}
