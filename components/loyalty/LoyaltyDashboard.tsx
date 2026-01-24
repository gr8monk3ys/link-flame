'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Tier configuration
const TIER_CONFIG = {
  SEEDLING: {
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    label: 'Seedling',
    description: 'Just getting started on your eco-journey',
  },
  SPROUT: {
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    label: 'Sprout',
    description: 'Growing your commitment to sustainability',
  },
  BLOOM: {
    color: 'bg-pink-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    label: 'Bloom',
    description: 'Flourishing as an eco-conscious shopper',
  },
  FLOURISH: {
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    label: 'Flourish',
    description: 'A true sustainability champion',
  },
}

type Tier = keyof typeof TIER_CONFIG

interface LoyaltySummary {
  availablePoints: number
  lifetimePoints: number
  tier: Tier
  tierInfo: {
    name: string
    multiplier: number
    benefits: string[]
  }
  nextTier: Tier | null
  pointsToNextTier: number
  maxDiscount: number
  config: {
    pointsPerDollar: number
    pointsPerDollarDiscount: number
    reviewPoints: number
    referralPoints: number
    signupBonus: number
  }
}

interface Transaction {
  id: string
  type: 'earned' | 'redeemed'
  points: number
  source?: string
  description?: string
  date: string
}

interface LoyaltyDashboardProps {
  className?: string
}

export function LoyaltyDashboard({ className }: LoyaltyDashboardProps) {
  const { data: session, status } = useSession()
  const [summary, setSummary] = useState<LoyaltySummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (status !== 'authenticated') return

      setLoading(true)
      setError(null)

      try {
        const [balanceRes, historyRes] = await Promise.all([
          fetch('/api/loyalty/balance'),
          fetch('/api/loyalty/history?limit=10'),
        ])

        if (balanceRes.ok) {
          const balanceData = await balanceRes.json()
          if (balanceData.success) {
            setSummary(balanceData.data)
          }
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json()
          if (historyData.success) {
            setTransactions(historyData.data.transactions)
          }
        }
      } catch (err) {
        setError('Failed to load loyalty data. Please try again.')
        console.error('Failed to fetch loyalty data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [status])

  if (status === 'loading' || loading) {
    return <LoyaltyDashboardSkeleton className={className} />
  }

  if (status !== 'authenticated' || !session) {
    return (
      <Card className={cn('text-center', className)}>
        <CardContent className="py-12">
          <p className="text-muted-foreground">
            Please sign in to view your rewards dashboard.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('text-center', className)}>
        <CardContent className="py-12">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  const tierConfig = TIER_CONFIG[summary.tier] || TIER_CONFIG.SEEDLING
  const progressPercent = summary.nextTier
    ? ((summary.tierInfo.multiplier - 1) / 0.5) * 100
    : 100

  return (
    <div className={cn('space-y-6', className)}>
      {/* Points Overview */}
      <Card className={cn('overflow-hidden', tierConfig.borderColor)}>
        <div className={cn('p-6', tierConfig.bgColor)}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge className={cn('mb-2', tierConfig.color)}>
                {tierConfig.label} Tier
              </Badge>
              <p className={cn('text-sm', tierConfig.textColor)}>
                {tierConfig.description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">
                {summary.availablePoints.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Available Points</p>
            </div>
          </div>

          {/* Tier Progress */}
          {summary.nextTier && (
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className={tierConfig.textColor}>
                  {summary.tierInfo.name}
                </span>
                <span className="text-muted-foreground">
                  {TIER_CONFIG[summary.nextTier]?.label || 'Max Tier'}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn('h-full transition-all', tierConfig.color)}
                  style={{
                    width: `${Math.min(
                      100,
                      ((summary.lifetimePoints % 500) / 500) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {summary.pointsToNextTier.toLocaleString()} points to{' '}
                {TIER_CONFIG[summary.nextTier]?.label || 'next tier'}
              </p>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-semibold">
                {summary.lifetimePoints.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Lifetime Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">
                {summary.tierInfo.multiplier}x
              </p>
              <p className="text-sm text-muted-foreground">Points Multiplier</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">
                ${summary.maxDiscount.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Available Discount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Earn Points */}
      <Card>
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
          <CardDescription>
            Multiple ways to grow your rewards balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                >
                  <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Shop & Earn</p>
                <p className="text-sm text-muted-foreground">
                  Earn {summary.config.pointsPerDollar} point per $1 spent
                  {summary.tierInfo.multiplier > 1 &&
                    ` (${summary.tierInfo.multiplier}x with your tier!)`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">Write Reviews</p>
                <p className="text-sm text-muted-foreground">
                  Earn {summary.config.reviewPoints} points per product review
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                >
                  <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Refer Friends</p>
                <p className="text-sm text-muted-foreground">
                  Earn {summary.config.referralPoints} points per successful referral
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15.19a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">Tier Benefits</p>
                <p className="text-sm text-muted-foreground">
                  Higher tiers earn up to 1.5x points on purchases
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Your {tierConfig.label} Benefits</CardTitle>
          <CardDescription>
            Exclusive perks for your current tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.tierInfo.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={cn('size-5', tierConfig.textColor)}
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your points history</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No activity yet. Start shopping to earn points!
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full',
                        transaction.type === 'earned'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-orange-100 text-orange-600'
                      )}
                    >
                      {transaction.type === 'earned' ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {transaction.description || transaction.source}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      'font-semibold',
                      transaction.type === 'earned'
                        ? 'text-green-600'
                        : 'text-orange-600'
                    )}
                  >
                    {transaction.type === 'earned' ? '+' : ''}
                    {transaction.points.toLocaleString()} pts
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LoyaltyDashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-6 w-24 rounded bg-muted" />
            <div className="h-10 w-32 rounded bg-muted" />
            <div className="h-2 w-full rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-40 rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
