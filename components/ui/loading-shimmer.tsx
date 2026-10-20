'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingShimmerProps {
  number?: number
  className?: string
}

/**
 * A loading row: flat tinted-paper blocks pulsing inside a hairline. The
 * sweep-of-light shimmer is gone; `animate-pulse` is one of the stated
 * reduced-motion exceptions and slows to 3s rather than stopping.
 */
export const LoadingShimmer: React.FC<LoadingShimmerProps> = ({
  number = 1,
  className = ''
}) => {
  return (
    <>
      {Array.from({ length: number }).map((_, i) => (
        <div key={i} className={cn('animate-pulse', className)} aria-hidden="true">
          <div className="flex space-x-4 rounded-xl border border-border bg-card p-4">
            <div className="plate size-24"></div>
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 w-3/4 rounded-sm bg-muted"></div>
              <div className="h-4 w-1/2 rounded-sm bg-muted"></div>
              <div className="h-4 w-1/4 rounded-sm bg-muted"></div>
            </div>
            <div className="size-8 rounded-sm bg-muted"></div>
          </div>
        </div>
      ))}
    </>
  )
}

/**
 * Generic skeleton for loading states: a tinted-paper block that pulses.
 * Use for code-split component loading fallbacks.
 */
interface SkeletonProps {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-sm bg-muted',
        className
      )}
    />
  )
}
