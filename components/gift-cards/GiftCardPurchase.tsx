'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Preset amounts for quick selection
const PRESET_AMOUNTS = [25, 50, 100, 150, 200] as const
const MIN_CUSTOM_AMOUNT = 10
const MAX_CUSTOM_AMOUNT = 500

interface PurchasedGiftCard {
  id: string
  code: string
  amount: number
  balance: number
  status: string
  expiresAt: string | null
}

interface GiftCardPurchaseProps {
  onPurchaseComplete?: (giftCard: PurchasedGiftCard) => void
  className?: string
}

export function GiftCardPurchase({ onPurchaseComplete, className }: GiftCardPurchaseProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [isCustom, setIsCustom] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [purchasedCard, setPurchasedCard] = useState<PurchasedGiftCard | null>(null)

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

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setIsCustom(false)
    setCustomAmount('')
  }

  const handleCustomAmountFocus = () => {
    setIsCustom(true)
    setSelectedAmount(null)
  }

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '')
    setCustomAmount(value)
    setIsCustom(true)
    setSelectedAmount(null)
  }

  const getEffectiveAmount = (): number | null => {
    if (isCustom && customAmount) {
      const parsed = parseFloat(customAmount)
      if (!isNaN(parsed) && parsed >= MIN_CUSTOM_AMOUNT && parsed <= MAX_CUSTOM_AMOUNT) {
        return parsed
      }
      return null
    }
    return selectedAmount
  }

  const validateForm = (): string | null => {
    const amount = getEffectiveAmount()

    if (!amount) {
      if (isCustom && customAmount) {
        const parsed = parseFloat(customAmount)
        if (parsed < MIN_CUSTOM_AMOUNT) {
          return `Minimum amount is $${MIN_CUSTOM_AMOUNT}`
        }
        if (parsed > MAX_CUSTOM_AMOUNT) {
          return `Maximum amount is $${MAX_CUSTOM_AMOUNT}`
        }
      }
      return 'Please select or enter an amount'
    }

    if (recipientEmail && !/\S+@\S+\.\S+/.test(recipientEmail)) {
      return 'Please enter a valid email address'
    }

    if (message.length > 500) {
      return 'Message cannot exceed 500 characters'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    const amount = getEffectiveAmount()
    if (!amount) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        body: JSON.stringify({
          amount,
          recipientName: recipientName || null,
          recipientEmail: recipientEmail || null,
          message: message || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to purchase gift card')
      }

      const giftCard: PurchasedGiftCard = data.data
      setPurchasedCard(giftCard)
      toast.success('Gift card purchased successfully!')
      onPurchaseComplete?.(giftCard)
    } catch (error) {
      console.error('Gift card purchase error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to purchase gift card')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchaseAnother = () => {
    setPurchasedCard(null)
    setSelectedAmount(50)
    setCustomAmount('')
    setIsCustom(false)
    setRecipientName('')
    setRecipientEmail('')
    setMessage('')
  }

  // Show success state after purchase
  if (purchasedCard) {
    return (
      <div className={cn('rounded-lg border bg-card p-6', className)}>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="size-8 text-green-600"
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
          <h3 className="text-lg font-semibold text-gray-900">Gift Card Purchased!</h3>
          <p className="text-sm text-gray-600">
            Your gift card is ready to use or share.
          </p>

          <div className="mt-6 space-y-3 rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Gift Card Code</p>
              <p className="mt-1 font-mono text-xl font-bold tracking-wider text-gray-900">
                {purchasedCard.code}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Amount</p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                ${purchasedCard.amount.toFixed(2)}
              </p>
            </div>
            {purchasedCard.expiresAt && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Expires</p>
                <p className="mt-1 text-sm text-gray-700">
                  {new Date(purchasedCard.expiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(purchasedCard.code)
                toast.success('Gift card code copied to clipboard!')
              }}
              variant="outline"
            >
              Copy Code
            </Button>
            <Button onClick={handlePurchaseAnother} variant="ghost">
              Purchase Another
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Purchase a Gift Card</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Selection */}
        <div className="space-y-3">
          <Label id="amount-label">Select Amount</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PRESET_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                type="button"
                variant={selectedAmount === amount && !isCustom ? 'default' : 'outline'}
                onClick={() => handleAmountSelect(amount)}
                className="h-12"
              >
                ${amount}
              </Button>
            ))}
          </div>

          <div className="relative mt-3">
            <Label htmlFor="customAmount" className="sr-only">
              Custom Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="customAmount"
                type="text"
                inputMode="decimal"
                placeholder="Custom amount"
                value={customAmount}
                onChange={handleCustomAmountChange}
                onFocus={handleCustomAmountFocus}
                className={cn(
                  'pl-8',
                  isCustom && customAmount && 'ring-2 ring-primary'
                )}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Min ${MIN_CUSTOM_AMOUNT} - Max ${MAX_CUSTOM_AMOUNT}
            </p>
          </div>
        </div>

        {/* Recipient Details (Optional) */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700">
            Recipient Details <span className="text-gray-400">(Optional)</span>
          </h4>

          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name</Label>
            <Input
              id="recipientName"
              type="text"
              placeholder="Enter recipient's name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              maxLength={100}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              maxLength={254}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              We will send the gift card code to this email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message</Label>
            <textarea
              id="message"
              placeholder="Write a message for the recipient..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              disabled={isLoading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-right text-xs text-gray-500">
              {message.length}/500 characters
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="h-12 w-full text-base"
          disabled={isLoading || !getEffectiveAmount()}
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
              Processing...
            </span>
          ) : (
            <>
              Purchase Gift Card
              {getEffectiveAmount() && (
                <span className="ml-2">- ${getEffectiveAmount()?.toFixed(2)}</span>
              )}
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
