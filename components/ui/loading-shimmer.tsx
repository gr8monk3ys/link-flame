'use client'

import React from 'react'

interface LoadingShimmerProps {
  number?: number
  className?: string
}

export const LoadingShimmer: React.FC<LoadingShimmerProps> = ({ 
  number = 1, 
  className = '' 
}) => {
  return (
    <>
      {Array.from({ length: number }).map((_, i) => (
        <div key={i} className={`animate-pulse ${className}`}>
          <div className="flex space-x-4 rounded-lg border p-4">
            <div className="size-24 rounded-lg bg-gray-200"></div>
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-4 w-1/2 rounded bg-gray-200"></div>
              <div className="h-4 w-1/4 rounded bg-gray-200"></div>
            </div>
            <div className="size-8 rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
    </>
  )
}
