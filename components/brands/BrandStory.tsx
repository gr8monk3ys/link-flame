'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { BRAND_CERTIFICATIONS, BRAND_VALUES, type BrandCertification, type BrandValue } from '@/app/api/brands/route'
import { Quote, Leaf, Award, Heart, Globe } from 'lucide-react'

export interface BrandStoryProps {
  story: string | null
  certifications: string[]
  values: string[]
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

export function BrandStory({ story, certifications, values, className }: BrandStoryProps) {
  const certificationDetails = certifications
    .map(getCertificationDetails)
    .filter(Boolean) as BrandCertification[]

  const valueDetails = values
    .map(getValueDetails)
    .filter(Boolean) as BrandValue[]

  if (!story && certificationDetails.length === 0 && valueDetails.length === 0) {
    return null
  }

  return (
    <section className={cn('py-12', className)}>
      <div className="mx-auto max-w-4xl">
        {/* Story Section */}
        {story && (
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Quote className="size-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Our Story</h2>
            </div>
            <div className="prose prose-green max-w-none">
              {story.split('\n\n').map((paragraph, index) => (
                <p key={index} className="leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Certifications Section */}
        {certificationDetails.length > 0 && (
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <Award className="size-5 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold">Certifications</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {certificationDetails.map((cert) => (
                <div
                  key={cert.slug}
                  className="flex items-start gap-4 rounded-lg border bg-card p-4"
                >
                  <div className="shrink-0 rounded-full bg-green-100 p-2">
                    <Leaf className="size-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {cert.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {cert.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Values Section */}
        {valueDetails.length > 0 && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Heart className="size-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold">Our Values</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {valueDetails.map((val) => (
                <div
                  key={val.slug}
                  className="flex items-start gap-4 rounded-lg border bg-card p-4"
                >
                  <div className="shrink-0 rounded-full bg-blue-50 p-2">
                    <Globe className="size-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {val.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {val.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default BrandStory
