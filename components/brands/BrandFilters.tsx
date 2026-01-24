'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BRAND_CERTIFICATIONS, BRAND_VALUES } from '@/app/api/brands/route'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

export interface BrandFiltersProps {
  className?: string
}

export function BrandFilters({ className }: BrandFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showCertifications, setShowCertifications] = React.useState(true)
  const [showValues, setShowValues] = React.useState(true)

  const activeCertification = searchParams.get('certification')
  const activeValue = searchParams.get('value')

  const hasActiveFilters = activeCertification || activeValue

  const updateFilter = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value === null) {
        params.delete(key)
      } else {
        // Toggle filter - if clicking the same one, remove it
        const currentValue = params.get(key)
        if (currentValue === value) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }

      // Reset page when filters change
      params.delete('page')

      router.push(`/brands?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearAllFilters = React.useCallback(() => {
    router.push('/brands')
  }, [router])

  return (
    <aside className={cn('space-y-6', className)}>
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Filter className="size-5" />
          Filters
        </h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 size-4" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="border-b pb-4">
          <p className="mb-2 text-sm text-muted-foreground">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {activeCertification && (
              <Badge
                variant="secondary"
                className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200"
                onClick={() => updateFilter('certification', null)}
              >
                {BRAND_CERTIFICATIONS.find((c) => c.slug === activeCertification)?.name || activeCertification}
                <X className="ml-1 size-3" />
              </Badge>
            )}
            {activeValue && (
              <Badge
                variant="secondary"
                className="cursor-pointer border-blue-200 text-blue-700"
                onClick={() => updateFilter('value', null)}
              >
                {BRAND_VALUES.find((v) => v.slug === activeValue)?.name || activeValue}
                <X className="ml-1 size-3" />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Certifications */}
      <div className="border-b pb-4">
        <button
          type="button"
          onClick={() => setShowCertifications(!showCertifications)}
          className="flex w-full items-center justify-between py-2 text-left font-medium"
        >
          <span>Certifications</span>
          {showCertifications ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>

        {showCertifications && (
          <div className="mt-3 space-y-2">
            {BRAND_CERTIFICATIONS.map((cert) => {
              const isActive = activeCertification === cert.slug
              return (
                <button
                  key={cert.slug}
                  type="button"
                  onClick={() => updateFilter('certification', cert.slug)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-green-100 text-green-800'
                      : 'hover:bg-gray-100'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-4 items-center justify-center rounded border-2',
                      isActive
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-300'
                    )}
                  >
                    {isActive && (
                      <svg
                        className="size-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-left">{cert.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Values */}
      <div>
        <button
          type="button"
          onClick={() => setShowValues(!showValues)}
          className="flex w-full items-center justify-between py-2 text-left font-medium"
        >
          <span>Brand Values</span>
          {showValues ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>

        {showValues && (
          <div className="mt-3 space-y-2">
            {BRAND_VALUES.map((val) => {
              const isActive = activeValue === val.slug
              return (
                <button
                  key={val.slug}
                  type="button"
                  onClick={() => updateFilter('value', val.slug)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-100'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-4 items-center justify-center rounded border-2',
                      isActive
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    )}
                  >
                    {isActive && (
                      <svg
                        className="size-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-left">{val.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}

export default BrandFilters
