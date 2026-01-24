'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BRAND_CERTIFICATIONS, BRAND_VALUES, type BrandCertification, type BrandValue } from '@/app/api/brands/route'
import { ExternalLink, MapPin, Calendar, Building2 } from 'lucide-react'

export interface BrandHeroProps {
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
    featured?: boolean
  }
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

export function BrandHero({ brand, className }: BrandHeroProps) {
  const certificationDetails = brand.certifications
    .map(getCertificationDetails)
    .filter(Boolean) as BrandCertification[]

  const valueDetails = brand.values
    .map(getValueDetails)
    .filter(Boolean) as BrandValue[]

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Logo Section */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative aspect-square rounded-2xl border bg-white p-8 shadow-lg">
              {brand.logo ? (
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Building2 className="size-32 text-gray-300" />
                </div>
              )}

              {brand.featured && (
                <Badge className="absolute right-4 top-4 bg-primary text-primary-foreground">
                  Featured Partner
                </Badge>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              {brand.name}
            </h1>

            {brand.description && (
              <p className="mt-4 text-lg text-muted-foreground">
                {brand.description}
              </p>
            )}

            {/* Meta Info */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              {brand.headquarters && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{brand.headquarters}</span>
                </div>
              )}
              {brand.foundedYear && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>Founded {brand.foundedYear}</span>
                </div>
              )}
            </div>

            {/* Certifications */}
            {certificationDetails.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium text-gray-900">
                  Certifications
                </h3>
                <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {certificationDetails.map((cert) => (
                    <Badge
                      key={cert.slug}
                      variant="secondary"
                      className="bg-green-100 text-green-800 hover:bg-green-200"
                      title={cert.description}
                    >
                      {cert.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Values */}
            {valueDetails.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-3 text-sm font-medium text-gray-900">
                  Brand Values
                </h3>
                <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {valueDetails.map((val) => (
                    <Badge
                      key={val.slug}
                      variant="outline"
                      className="border-blue-200 text-blue-700"
                      title={val.description}
                    >
                      {val.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Website Button */}
            {brand.website && (
              <div className="mt-8">
                <Button asChild variant="outline" size="lg">
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <ExternalLink className="size-4" />
                    Visit Website
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute left-0 top-0 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-200/30 blur-3xl" />
      <div className="absolute bottom-0 right-0 size-96 translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
    </section>
  )
}

export default BrandHero
