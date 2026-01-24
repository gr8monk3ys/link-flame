'use client'

import { useEffect, useState, useCallback } from 'react'
import { PaymentRequest, Stripe, PaymentRequestPaymentMethodEvent } from '@stripe/stripe-js'
import { getStripeClient, isStripeConfigured } from '@/lib/stripe-client'
import { useCart } from '@/lib/providers/CartProvider'
import { toast } from 'sonner'

export type PaymentRequestButtonProps = {
  /** Callback when payment is successfully completed */
  onPaymentSuccess?: (paymentMethodId: string) => void
  /** Callback when payment fails */
  onPaymentError?: (error: Error) => void
  /** Optional CSS class name */
  className?: string
  /** Whether the button is disabled */
  disabled?: boolean
}

type WalletType = 'applePay' | 'googlePay' | 'browserCard' | null

/**
 * PaymentRequestButton component that displays Apple Pay, Google Pay,
 * or browser-saved card payment options when available.
 *
 * This component uses the Stripe Payment Request API to detect and display
 * the appropriate wallet payment method based on the user's device and browser.
 *
 * @example
 * ```tsx
 * <PaymentRequestButton
 *   onPaymentSuccess={(paymentMethodId) => {
 *     // Handle successful payment
 *     console.log('Payment method:', paymentMethodId)
 *   }}
 *   onPaymentError={(error) => {
 *     // Handle payment error
 *     console.error('Payment failed:', error)
 *   }}
 * />
 * ```
 */
export function PaymentRequestButton({
  onPaymentSuccess,
  onPaymentError,
  className = '',
  disabled = false,
}: PaymentRequestButtonProps) {
  const { cart, cartTotal } = useCart()
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)
  const [walletType, setWalletType] = useState<WalletType>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [canMakePayment, setCanMakePayment] = useState(false)

  // Initialize Stripe
  useEffect(() => {
    if (!isStripeConfigured()) {
      setIsLoading(false)
      return
    }

    getStripeClient().then((stripeInstance) => {
      setStripe(stripeInstance)
    })
  }, [])

  // Create and configure PaymentRequest when Stripe is loaded and cart changes
  useEffect(() => {
    if (!stripe || cartTotal.raw <= 0) {
      setIsLoading(false)
      return
    }

    // Build display items from cart
    const displayItems = cart.items.map((item) => ({
      label: `${item.title}${item.quantity > 1 ? ` x${item.quantity}` : ''}`,
      amount: Math.round(item.price * item.quantity * 100), // Convert to cents
    }))

    // Create PaymentRequest
    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Link Flame Order',
        amount: Math.round(cartTotal.raw * 100), // Convert to cents
      },
      displayItems,
      requestPayerName: true,
      requestPayerEmail: true,
    })

    // Check if the browser supports any payment method
    pr.canMakePayment().then((result) => {
      setIsLoading(false)

      if (result) {
        setCanMakePayment(true)
        setPaymentRequest(pr)

        // Determine which wallet type is available
        if (result.applePay) {
          setWalletType('applePay')
        } else if (result.googlePay) {
          setWalletType('googlePay')
        } else {
          setWalletType('browserCard')
        }
      } else {
        setCanMakePayment(false)
        setPaymentRequest(null)
        setWalletType(null)
      }
    })

    // Handle the payment method event
    const handlePaymentMethod = async (event: PaymentRequestPaymentMethodEvent) => {
      try {
        // Get the payment method ID from the event
        const paymentMethodId = event.paymentMethod.id

        // Here you would typically send this to your server to create a payment
        // For now, we'll call the success callback and complete the payment
        if (onPaymentSuccess) {
          onPaymentSuccess(paymentMethodId)
        }

        // Complete the payment on the client side
        // In a real implementation, you'd wait for server confirmation
        event.complete('success')
        toast.success('Payment initiated successfully!')
      } catch (error) {
        console.error('Payment failed:', error)
        event.complete('fail')

        const errorObj = error instanceof Error ? error : new Error('Payment failed')
        if (onPaymentError) {
          onPaymentError(errorObj)
        }
        toast.error('Payment failed. Please try again.')
      }
    }

    pr.on('paymentmethod', handlePaymentMethod)

    // Cleanup
    return () => {
      pr.off('paymentmethod', handlePaymentMethod)
    }
  }, [stripe, cart, cartTotal, onPaymentSuccess, onPaymentError])

  // Handle button click
  const handleClick = useCallback(() => {
    if (paymentRequest && !disabled) {
      paymentRequest.show()
    }
  }, [paymentRequest, disabled])

  // Don't render anything if we can't make payments
  if (!canMakePayment && !isLoading) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-12 w-full rounded-md bg-gray-200" />
      </div>
    )
  }

  // Render the appropriate button based on wallet type
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !paymentRequest}
      className={`
        flex w-full items-center justify-center gap-2 rounded-md px-4 py-3
        font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${walletType === 'applePay'
          ? 'bg-black text-white hover:bg-gray-800 focus:ring-gray-900'
          : walletType === 'googlePay'
          ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
        }
        ${className}
      `}
      aria-label={getButtonAriaLabel(walletType)}
    >
      {walletType === 'applePay' && <ApplePayIcon />}
      {walletType === 'googlePay' && <GooglePayIcon />}
      {walletType === 'browserCard' && <CardIcon />}
      <span>{getButtonLabel(walletType)}</span>
    </button>
  )
}

// Helper function to get button label
function getButtonLabel(walletType: WalletType): string {
  switch (walletType) {
    case 'applePay':
      return 'Pay with Apple Pay'
    case 'googlePay':
      return 'Pay with Google Pay'
    case 'browserCard':
      return 'Pay with saved card'
    default:
      return 'Express checkout'
  }
}

// Helper function to get aria label
function getButtonAriaLabel(walletType: WalletType): string {
  switch (walletType) {
    case 'applePay':
      return 'Pay with Apple Pay'
    case 'googlePay':
      return 'Pay with Google Pay'
    case 'browserCard':
      return 'Pay with browser saved card'
    default:
      return 'Express checkout'
  }
}

// Apple Pay Icon
function ApplePayIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

// Google Pay Icon
function GooglePayIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
        fill="#4285F4"
      />
      <path
        d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
        fill="url(#google-pay-gradient)"
      />
      <defs>
        <linearGradient
          id="google-pay-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="100%" stopColor="#34A853" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Card Icon
function CardIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  )
}

export default PaymentRequestButton
