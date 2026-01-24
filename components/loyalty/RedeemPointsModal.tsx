'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'

export interface RedeemPointsModalProps {
  isOpen: boolean
  onClose: () => void
  onRedeem: (discount: number) => void
  maxOrderTotal?: number
}

interface RedemptionPreview {
  availablePoints: number
  maxDiscount: number
  pointsPerDollarDiscount: number
  minimumRedemption: number
}

/**
 * Modal for redeeming loyalty points at checkout.
 * Allows users to choose how many points to redeem.
 *
 * This component is designed to be lazy-loaded via dynamic import
 * for better performance (code splitting).
 */
export function RedeemPointsModal({
  isOpen,
  onClose,
  onRedeem,
  maxOrderTotal,
}: RedeemPointsModalProps) {
  const { data: session } = useSession()
  const [preview, setPreview] = useState<RedemptionPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [redeeming, setRedeeming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  // Calculate discount from points
  const calculateDiscount = useCallback(
    (points: number) => {
      if (!preview) return 0
      return points / preview.pointsPerDollarDiscount
    },
    [preview]
  )

  // Calculate max redeemable points (limited by available points and order total)
  const maxRedeemablePoints = useCallback(() => {
    if (!preview) return 0

    let maxPoints = preview.availablePoints

    // If order total is specified, cap discount to order total
    if (maxOrderTotal !== undefined) {
      const maxDiscountPoints = Math.floor(
        maxOrderTotal * preview.pointsPerDollarDiscount
      )
      maxPoints = Math.min(maxPoints, maxDiscountPoints)
    }

    return maxPoints
  }, [preview, maxOrderTotal])

  // Fetch redemption preview data and CSRF token
  useEffect(() => {
    async function fetchData() {
      if (!isOpen || !session) return

      setLoading(true)
      setError(null)

      try {
        // Fetch both preview and CSRF token in parallel
        const [previewRes, csrfRes] = await Promise.all([
          fetch('/api/loyalty/redeem'),
          fetch('/api/csrf'),
        ])

        if (previewRes.ok) {
          const data = await previewRes.json()
          if (data.success) {
            setPreview(data.data)
            // Set initial points to minimum or 0
            setPointsToRedeem(0)
          }
        }

        if (csrfRes.ok) {
          const csrfData = await csrfRes.json()
          setCsrfToken(csrfData.token)
        }
      } catch (err) {
        setError('Failed to load redemption data')
        console.error('Error fetching redemption data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, session])

  // Handle redemption
  const handleRedeem = async () => {
    if (!preview || pointsToRedeem < preview.minimumRedemption || !csrfToken) return

    setRedeeming(true)
    setError(null)

    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          pointsToRedeem,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const discount = calculateDiscount(pointsToRedeem)
        onRedeem(discount)
        onClose()
      } else {
        setError(data.error?.message || 'Failed to redeem points')
      }
    } catch (err) {
      setError('Failed to redeem points. Please try again.')
      console.error('Error redeeming points:', err)
    } finally {
      setRedeeming(false)
    }
  }

  const discount = calculateDiscount(pointsToRedeem)
  const maxPoints = maxRedeemablePoints()
  const canRedeem =
    preview && pointsToRedeem >= preview.minimumRedemption && pointsToRedeem <= maxPoints

  // Quick select options
  const quickSelectOptions = preview
    ? [
        {
          label: '25%',
          points: Math.floor(maxPoints * 0.25),
        },
        {
          label: '50%',
          points: Math.floor(maxPoints * 0.5),
        },
        {
          label: '75%',
          points: Math.floor(maxPoints * 0.75),
        },
        {
          label: 'Max',
          points: maxPoints,
        },
      ].filter((opt) => opt.points >= (preview.minimumRedemption || 0))
    : []

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redeem Rewards Points</DialogTitle>
          <DialogDescription>
            Use your points to get a discount on this order
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : !preview ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Unable to load redemption data. Please try again.
            </p>
          </div>
        ) : preview.availablePoints < preview.minimumRedemption ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-8 text-amber-600"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="font-medium">Not enough points yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You need at least {preview.minimumRedemption} points to redeem.
              <br />
              You currently have {preview.availablePoints} points.
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Points Balance */}
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Available Points</p>
              <p className="text-3xl font-bold">
                {preview.availablePoints.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Worth up to ${preview.maxDiscount.toFixed(2)} in discounts
              </p>
            </div>

            {/* Points Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Points to Redeem</label>
                <span className="text-lg font-semibold">
                  {pointsToRedeem.toLocaleString()}
                </span>
              </div>

              <Slider
                value={[pointsToRedeem]}
                onValueChange={([value]) => setPointsToRedeem(value)}
                min={0}
                max={maxPoints}
                step={preview.minimumRedemption}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{maxPoints.toLocaleString()} max</span>
              </div>
            </div>

            {/* Quick Select Buttons */}
            {quickSelectOptions.length > 0 && (
              <div className="flex gap-2">
                {quickSelectOptions.map((option) => (
                  <Button
                    key={option.label}
                    variant={pointsToRedeem === option.points ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPointsToRedeem(option.points)}
                    className="flex-1"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Discount Preview */}
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-green-800">Your Discount</span>
                <span className="text-2xl font-bold text-green-600">
                  ${discount.toFixed(2)}
                </span>
              </div>
              {maxOrderTotal !== undefined && discount > maxOrderTotal && (
                <p className="mt-2 text-sm text-amber-600">
                  Note: Discount will be capped at your order total (${maxOrderTotal.toFixed(2)})
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={redeeming}>
            Cancel
          </Button>
          <Button
            onClick={handleRedeem}
            disabled={!canRedeem || redeeming}
            className="bg-green-600 hover:bg-green-700"
          >
            {redeeming ? (
              <>
                <span className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Redeeming...
              </>
            ) : (
              <>Apply ${discount.toFixed(2)} Discount</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Default export for dynamic import
export default RedeemPointsModal

/**
 * Inline widget for redeeming loyalty points at checkout.
 * A simplified version of the full modal for embedding in forms.
 */
export interface InlineRedeemWidgetProps {
  onDiscountApplied: (discount: number) => void
  maxOrderTotal?: number
}

export function InlineRedeemWidget({
  onDiscountApplied,
  maxOrderTotal,
}: InlineRedeemWidgetProps) {
  const { data: session, status: sessionStatus } = useSession()
  const [preview, setPreview] = useState<RedemptionPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  // Calculate discount from points
  const calculateDiscount = useCallback(
    (points: number) => {
      if (!preview) return 0
      return points / preview.pointsPerDollarDiscount
    },
    [preview]
  )

  // Calculate max redeemable points
  const maxRedeemablePoints = useCallback(() => {
    if (!preview) return 0
    let maxPoints = preview.availablePoints
    if (maxOrderTotal !== undefined) {
      const maxDiscountPoints = Math.floor(
        maxOrderTotal * preview.pointsPerDollarDiscount
      )
      maxPoints = Math.min(maxPoints, maxDiscountPoints)
    }
    return maxPoints
  }, [preview, maxOrderTotal])

  // Fetch redemption preview data
  useEffect(() => {
    async function fetchData() {
      if (sessionStatus !== 'authenticated') return

      setLoading(true)
      setError(null)

      try {
        const [previewRes, csrfRes] = await Promise.all([
          fetch('/api/loyalty/redeem'),
          fetch('/api/csrf'),
        ])

        if (previewRes.ok) {
          const data = await previewRes.json()
          if (data.success) {
            setPreview(data.data)
          }
        }

        if (csrfRes.ok) {
          const csrfData = await csrfRes.json()
          setCsrfToken(csrfData.token)
        }
      } catch (err) {
        setError('Failed to load points')
        console.error('Error fetching redemption data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionStatus])

  // Handle applying discount
  const handleApplyDiscount = async () => {
    if (!preview || pointsToRedeem < preview.minimumRedemption || !csrfToken) return

    setApplying(true)
    setError(null)

    try {
      const response = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ pointsToRedeem }),
      })

      const data = await response.json()

      if (data.success) {
        const discount = calculateDiscount(pointsToRedeem)
        setAppliedDiscount(discount)
        onDiscountApplied(discount)
      } else {
        setError(data.error?.message || 'Failed to apply discount')
      }
    } catch (err) {
      setError('Failed to apply discount')
      console.error('Error applying discount:', err)
    } finally {
      setApplying(false)
    }
  }

  // Remove applied discount
  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    setPointsToRedeem(0)
    onDiscountApplied(0)
  }

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
        Loading rewards...
      </div>
    )
  }

  if (sessionStatus !== 'authenticated') {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in to use your loyalty points
      </p>
    )
  }

  if (!preview || preview.availablePoints < preview.minimumRedemption) {
    return (
      <p className="text-sm text-muted-foreground">
        {preview
          ? `You need ${preview.minimumRedemption} points to redeem (you have ${preview.availablePoints})`
          : 'No points available'}
      </p>
    )
  }

  const discount = calculateDiscount(pointsToRedeem)
  const maxPoints = maxRedeemablePoints()
  const canApply = pointsToRedeem >= preview.minimumRedemption && pointsToRedeem <= maxPoints

  if (appliedDiscount !== null) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
        <div>
          <span className="font-medium text-green-800">
            ${appliedDiscount.toFixed(2)} discount applied
          </span>
          <span className="ml-2 text-sm text-green-600">
            ({pointsToRedeem} points)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveDiscount}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Remove
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Available: {preview.availablePoints.toLocaleString()} points
        </span>
        <span className="font-medium">
          Worth up to ${preview.maxDiscount.toFixed(2)}
        </span>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Slider
            value={[pointsToRedeem]}
            onValueChange={([value]) => setPointsToRedeem(value)}
            min={0}
            max={maxPoints}
            step={preview.minimumRedemption}
            className="w-full"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{maxPoints.toLocaleString()} max</span>
          </div>
        </div>
      </div>

      {pointsToRedeem > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm">
            Use {pointsToRedeem.toLocaleString()} points for{' '}
            <span className="font-medium text-green-600">${discount.toFixed(2)} off</span>
          </span>
          <Button
            size="sm"
            onClick={handleApplyDiscount}
            disabled={!canApply || applying}
            className={cn(
              'bg-green-600 hover:bg-green-700',
              applying && 'opacity-50'
            )}
          >
            {applying ? 'Applying...' : 'Apply'}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
