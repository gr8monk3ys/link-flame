'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { BrandCard, type BrandCardProps } from './BrandCard'

export interface BrandGridProps {
  brands: BrandCardProps['brand'][]
  variant?: 'default' | 'compact' | 'featured'
  columns?: 2 | 3 | 4
  className?: string
  emptyMessage?: string
}

export function BrandGrid({
  brands,
  variant = 'default',
  columns = 4,
  className,
  emptyMessage = 'No brands found',
}: BrandGridProps) {
  if (brands.length === 0) {
    return (
      <div className={cn('py-12 text-center', className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div
      className={cn(
        'grid gap-6',
        gridCols[columns],
        className
      )}
    >
      {brands.map((brand) => (
        <BrandCard
          key={brand.id}
          brand={brand}
          variant={variant}
        />
      ))}
    </div>
  )
}

export default BrandGrid
