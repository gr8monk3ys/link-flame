'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { BRAND_CERTIFICATIONS, BRAND_VALUES, type BrandCertification, type BrandValue } from '@/app/api/brands/route'
import { Building2, ExternalLink, MapPin, Calendar } from 'lucide-react'

export interface BrandCardProps {
  brand: {
    id: string
    slug: string
    name: string
    description: string | null
    logo: string | null
    website: string | null
    headquarters: string | null
    foundedYear: number | null
    certifications: string[]
    values: string[]
    productCount?: number
    featured?: boolean
  }
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

// Helper to get certification details by slug
function getCertificationDetails(slug: string): BrandCertification | undefined {
  return BRAND_CERTIFICATIONS.find((c) => c.slug === slug)
}

// Helper to get value details by slug
function getValueDetails(slug: string): BrandValue | undefined {
  return BRAND_VALUES.find((v) => v.slug === slug)
}

export function BrandCard({ brand, variant = 'default', className }: BrandCardProps) {
  const certificationDetails = brand.certifications
    .map(getCertificationDetails)
    .filter(Boolean) as BrandCertification[]

  const valueDetails = brand.values
    .map(getValueDetails)
    .filter(Boolean) as BrandValue[]

  if (variant === 'compact') {
    return (
      <Link
        href={`/brands/${brand.slug}`}
        className={cn(
          'group flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md',
          className
        )}
      >
        {/* Logo */}
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {brand.logo ? (
            <Image
              src={brand.logo}
              alt={brand.name}
              fill
              className="object-contain p-2"
              sizes="64px"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Building2 className="size-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
            {brand.name}
          </h3>
          {brand.productCount !== undefined && (
            <p className="text-sm text-muted-foreground">
              {brand.productCount} product{brand.productCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/brands/${brand.slug}`}
        className={cn(
          'group block overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg',
          className
        )}
      >
        {/* Logo Header */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-green-50 to-emerald-100">
          {brand.logo ? (
            <Image
              src={brand.logo}
              alt={brand.name}
              fill
              className="object-contain p-8"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Building2 className="size-16 text-green-600/50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">
            {brand.name}
          </h3>

          {brand.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {brand.description}
            </p>
          )}

          {/* Certifications */}
          {certificationDetails.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {certificationDetails.slice(0, 3).map((cert) => (
                <Badge
                  key={cert.slug}
                  variant="secondary"
                  className="bg-green-100 text-green-800 hover:bg-green-200"
                >
                  {cert.name}
                </Badge>
              ))}
              {certificationDetails.length > 3 && (
                <Badge variant="outline">+{certificationDetails.length - 3}</Badge>
              )}
            </div>
          )}

          {/* Meta info */}
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            {brand.productCount !== undefined && (
              <span>{brand.productCount} products</span>
            )}
            <span className="text-primary group-hover:underline">
              View Brand
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Default variant
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className={cn(
        'group block overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md',
        className
      )}
    >
      {/* Logo */}
      <div className="relative aspect-square bg-gray-50 p-6">
        {brand.logo ? (
          <Image
            src={brand.logo}
            alt={brand.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Building2 className="size-16 text-gray-300" />
          </div>
        )}

        {brand.featured && (
          <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground">
            Featured
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
          {brand.name}
        </h3>

        {brand.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {brand.description}
          </p>
        )}

        {/* Meta */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {brand.headquarters && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {brand.headquarters}
            </span>
          )}
          {brand.foundedYear && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              Est. {brand.foundedYear}
            </span>
          )}
        </div>

        {/* Certifications */}
        {certificationDetails.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {certificationDetails.slice(0, 2).map((cert) => (
              <Badge
                key={cert.slug}
                variant="secondary"
                className="bg-green-100 text-xs text-green-800"
              >
                {cert.name}
              </Badge>
            ))}
            {certificationDetails.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{certificationDetails.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Values */}
        {valueDetails.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {valueDetails.slice(0, 2).map((val) => (
              <Badge
                key={val.slug}
                variant="outline"
                className="border-blue-200 text-xs text-blue-700"
              >
                {val.name}
              </Badge>
            ))}
            {valueDetails.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{valueDetails.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Product count */}
        {brand.productCount !== undefined && (
          <p className="mt-3 text-xs text-muted-foreground">
            {brand.productCount} product{brand.productCount !== 1 ? 's' : ''} available
          </p>
        )}
      </div>
    </Link>
  )
}

export default BrandCard
