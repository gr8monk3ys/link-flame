'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface GiftCardInfo {
  code: string
  balance: number
  initialBalance: number
  status: string
  expiresAt: string | null
  recipientName: string | null
  isValid: boolean
  validationMessage: string | null
  recentTransactions: Array<{
    amount: number
    type: string
    date: string
  }>
}

interface GiftCardBalanceProps {
  className?: string
  onBalanceChecked?: (info: GiftCardInfo) => void
}

export function GiftCardBalance({ className, onBalanceChecked }: GiftCardBalanceProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [giftCardInfo, setGiftCardInfo] = useState<GiftCardInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formatCodeInput = (value: string): string => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

    // Add dashes every 4 characters for display
    const parts = cleaned.match(/.{1,4}/g) || []
    return parts.join('-').slice(0, 19) // Max 16 chars + 3 dashes
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCodeInput(e.target.value)
    setCode(formatted)
    setError(null)
    setGiftCardInfo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Remove dashes for API call
    const cleanCode = code.replace(/-/g, '')

    if (cleanCode.length !== 16) {
      setError('Please enter a valid 16-character gift card code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/gift-cards/${cleanCode}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError('Gift card not found. Please check the code and try again.')
        } else {
          throw new Error(data.error?.message || 'Failed to check balance')
        }
        setGiftCardInfo(null)
        return
      }

      const info: GiftCardInfo = data.data
      setGiftCardInfo(info)
      onBalanceChecked?.(info)
    } catch (error) {
      console.error('Balance check error:', error)
      setError(error instanceof Error ? error.message : 'Failed to check balance')
      setGiftCardInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setCode('')
    setGiftCardInfo(null)
    setError(null)
  }

  const getStatusBadge = (status: string, isValid: boolean) => {
    if (!isValid) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          Unavailable
        </span>
      )
    }

    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Active
          </span>
        )
      case 'REDEEMED':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            Fully Redeemed
          </span>
        )
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            Expired
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            Cancelled
          </span>
        )
      default:
        return null
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return (
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )
      case 'REDEMPTION':
        return (
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )
      case 'REFUND':
        return (
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
            <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Check Gift Card Balance</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="giftCardCode">Gift Card Code</Label>
          <Input
            id="giftCardCode"
            type="text"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={code}
            onChange={handleCodeChange}
            disabled={isLoading}
            className={cn(
              'text-center font-mono text-lg tracking-wider',
              error && 'border-red-500'
            )}
            maxLength={19}
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || code.replace(/-/g, '').length < 16}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="mr-2 size-4 animate-spin"
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
              Checking...
            </span>
          ) : (
            'Check Balance'
          )}
        </Button>
      </form>

      {/* Gift Card Info Display */}
      {giftCardInfo && (
        <div className="mt-6 space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-gray-500">{giftCardInfo.code}</span>
            {getStatusBadge(giftCardInfo.status, giftCardInfo.isValid)}
          </div>

          {giftCardInfo.validationMessage && (
            <div className="rounded-md bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">{giftCardInfo.validationMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Current Balance
              </p>
              <p className={cn(
                'mt-1 text-2xl font-bold',
                giftCardInfo.balance > 0 ? 'text-green-600' : 'text-gray-400'
              )}>
                ${giftCardInfo.balance.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Original Amount
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-700">
                ${giftCardInfo.initialBalance.toFixed(2)}
              </p>
            </div>
          </div>

          {giftCardInfo.expiresAt && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Expires:</span>{' '}
              {new Date(giftCardInfo.expiresAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          )}

          {giftCardInfo.recipientName && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Recipient:</span> {giftCardInfo.recipientName}
            </div>
          )}

          {/* Recent Transactions */}
          {giftCardInfo.recentTransactions.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="mb-3 text-sm font-medium text-gray-700">Recent Activity</h4>
              <ul className="space-y-2">
                {giftCardInfo.recentTransactions.map((tx, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(tx.type)}
                      <span className="text-gray-600">
                        {tx.type === 'PURCHASE' && 'Card Loaded'}
                        {tx.type === 'REDEMPTION' && 'Redeemed'}
                        {tx.type === 'REFUND' && 'Refund'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          'font-medium',
                          tx.amount > 0 ? 'text-green-600' : 'text-gray-700'
                        )}
                      >
                        {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                      </span>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            onClick={handleReset}
          >
            Check Another Card
          </Button>
        </div>
      )}
    </div>
  )
}
