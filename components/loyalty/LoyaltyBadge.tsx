'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

// Tier colors and icons
const TIER_CONFIG = {
  SEEDLING: {
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-3.5"
      >
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4c1.5 0 2.5 1.5 2.5 3.5 0 1.5-.5 2.5-1.5 3.5v4.5c0 .552-.448 1-1 1s-1-.448-1-1V13c-1-1-1.5-2-1.5-3.5C9.5 7.5 10.5 6 12 6z" />
      </svg>
    ),
    label: 'Seedling',
  },
  SPROUT: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-3.5"
      >
        <path d="M7 17.5c0-3.5 2.5-6 6-7.5-1.5 0-3 .5-4 1.5 0-3 2.5-5.5 6-6.5-2 0-4 1-5 2.5C10.5 4.5 13 2 18 2c0 5-2.5 8.5-6 10v5.5c0 .276-.224.5-.5.5h-4c-.276 0-.5-.224-.5-.5V17.5z" />
      </svg>
    ),
    label: 'Sprout',
  },
  BLOOM: {
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-3.5"
      >
        <path d="M12 2C9.243 2 7 4.243 7 7c0 2.068 1.258 3.841 3.052 4.598C8.843 12.399 8 13.612 8 15c0 1.657.895 3.104 2.227 3.872C9.088 19.478 8 20.637 8 22h8c0-1.363-1.088-2.522-2.227-3.128C15.105 18.104 16 16.657 16 15c0-1.388-.843-2.601-2.052-3.402C15.742 10.841 17 9.068 17 7c0-2.757-2.243-5-5-5z" />
      </svg>
    ),
    label: 'Bloom',
  },
  FLOURISH: {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-3.5"
      >
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>
    ),
    label: 'Flourish',
  },
}

interface LoyaltyData {
  availablePoints: number
  tier: keyof typeof TIER_CONFIG
  tierInfo: {
    name: string
    multiplier: number
  }
}

interface LoyaltyBadgeProps {
  className?: string
  showPoints?: boolean
  compact?: boolean
}

export function LoyaltyBadge({ className, showPoints = true, compact = false }: LoyaltyBadgeProps) {
  const { data: session, status } = useSession()
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchLoyalty() {
      if (status !== 'authenticated') return

      setLoading(true)
      try {
        const response = await fetch('/api/loyalty/balance')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setLoyaltyData(data.data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch loyalty data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLoyalty()
  }, [status])

  // Don't render if not authenticated
  if (status !== 'authenticated' || !session) {
    return null
  }

  // Loading state
  if (loading && !loyaltyData) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-6 w-20 rounded-full bg-muted" />
      </div>
    )
  }

  // No data yet
  if (!loyaltyData) {
    return null
  }

  const tierConfig = TIER_CONFIG[loyaltyData.tier] || TIER_CONFIG.SEEDLING

  if (compact) {
    return (
      <Link
        href="/account/loyalty"
        className={cn(
          'flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors hover:opacity-80',
          tierConfig.color,
          className
        )}
        title={`${tierConfig.label} - ${loyaltyData.availablePoints} points`}
      >
        {tierConfig.icon}
        <span>{loyaltyData.availablePoints}</span>
      </Link>
    )
  }

  return (
    <Link
      href="/account/loyalty"
      className={cn(
        'group flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all hover:shadow-sm',
        tierConfig.color,
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        {tierConfig.icon}
        <span className="hidden sm:inline">{tierConfig.label}</span>
      </span>
      {showPoints && (
        <>
          <span className="h-3 w-px bg-current opacity-30" />
          <span className="font-semibold">
            {loyaltyData.availablePoints.toLocaleString()} pts
          </span>
        </>
      )}
    </Link>
  )
}

/**
 * Minimal badge for tight spaces (just the tier icon)
 */
export function LoyaltyBadgeIcon({ className }: { className?: string }) {
  const { data: session, status } = useSession()
  const [tier, setTier] = useState<keyof typeof TIER_CONFIG | null>(null)

  useEffect(() => {
    async function fetchTier() {
      if (status !== 'authenticated') return

      try {
        const response = await fetch('/api/loyalty/balance')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.tier) {
            setTier(data.data.tier)
          }
        }
      } catch (error) {
        console.error('Failed to fetch tier:', error)
      }
    }

    fetchTier()
  }, [status])

  if (status !== 'authenticated' || !session || !tier) {
    return null
  }

  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.SEEDLING

  return (
    <Link
      href="/account/loyalty"
      className={cn(
        'flex size-8 items-center justify-center rounded-full border transition-colors hover:opacity-80',
        tierConfig.color,
        className
      )}
      title={`${tierConfig.label} tier`}
    >
      {tierConfig.icon}
    </Link>
  )
}
