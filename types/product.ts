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

export interface Product {
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
