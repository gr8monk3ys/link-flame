'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AppliedGiftCard {
  code: string
  amountApplied: number
  remainingBalance: number
}

interface GiftCardCheckoutProps {
  orderTotal: number
  onGiftCardApplied?: (discount: number, appliedCard: AppliedGiftCard) => void
  onGiftCardRemoved?: () => void
  disabled?: boolean
  className?: string
}

export function GiftCardCheckout({
  orderTotal,
  onGiftCardApplied,
  onGiftCardRemoved,
  disabled = false,
  className,
}: GiftCardCheckoutProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [appliedCard, setAppliedCard] = useState<AppliedGiftCard | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch CSRF token on mount
  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const response = await fetch('/api/csrf')
        if (response.ok) {
          const data = await response.json()
          setCsrfToken(data.token)
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error)
      }
    }
    fetchCsrfToken()
  }, [])

  const formatCodeInput = (value: string): string => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    const parts = cleaned.match(/.{1,4}/g) || []
    return parts.join('-').slice(0, 19)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCodeInput(e.target.value)
    setCode(formatted)
    setError(null)
  }

  const handleApply = async () => {
    const cleanCode = code.replace(/-/g, '')

    if (cleanCode.length !== 16) {
      setError('Please enter a valid 16-character gift card code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/gift-cards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        body: JSON.stringify({
          code: cleanCode,
          amount: orderTotal,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Please sign in to use a gift card')
          return
        }
        throw new Error(data.error?.message || 'Failed to apply gift card')
      }

      const result: AppliedGiftCard = {
        code: data.data.code,
        amountApplied: data.data.amountApplied,
        remainingBalance: data.data.remainingBalance,
      }

      setAppliedCard(result)
      onGiftCardApplied?.(result.amountApplied, result)
      toast.success(`Gift card applied! $${result.amountApplied.toFixed(2)} discount`)
    } catch (error) {
      console.error('Gift card apply error:', error)
      setError(error instanceof Error ? error.message : 'Failed to apply gift card')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = () => {
    setAppliedCard(null)
    setCode('')
    setError(null)
    onGiftCardRemoved?.()
    toast.info('Gift card removed')
  }

  // If a gift card is applied, show the applied state
  if (appliedCard) {
    return (
      <div className={cn('rounded-lg border bg-green-50 p-4', className)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-green-100">
              <svg
                className="size-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-800">Gift Card Applied</p>
              <p className="font-mono text-sm text-green-700">{appliedCard.code}</p>
              <p className="mt-1 text-sm text-green-600">
                ${appliedCard.amountApplied.toFixed(2)} discount applied
                {appliedCard.remainingBalance > 0 && (
                  <span className="text-green-500">
                    {' '}
                    (${appliedCard.remainingBalance.toFixed(2)} remaining)
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="text-green-700 hover:bg-green-100 hover:text-green-800"
          >
            Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className="size-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
          <span className="font-medium text-gray-700">Have a gift card?</span>
        </div>
        <svg
          className={cn(
            'size-5 text-gray-400 transition-transform',
            isExpanded && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="checkoutGiftCardCode" className="sr-only">
              Gift Card Code
            </Label>
            <div className="flex gap-2">
              <Input
                id="checkoutGiftCardCode"
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={code}
                onChange={handleCodeChange}
                disabled={disabled || isLoading}
                className={cn(
                  'font-mono tracking-wider',
                  error && 'border-red-500'
                )}
                maxLength={19}
              />
              <Button
                type="button"
                onClick={handleApply}
                disabled={disabled || isLoading || code.replace(/-/g, '').length < 16}
                className="shrink-0"
              >
                {isLoading ? (
                  <svg
                    className="size-4 animate-spin"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
