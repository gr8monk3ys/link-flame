'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentRequestButton } from './PaymentRequestButton'
import { useCart } from '@/lib/providers/CartProvider'
import { isStripeConfigured } from '@/lib/stripe-client'
import { toast } from 'sonner'

export type ExpressCheckoutProps = {
  /** Whether express checkout is disabled */
  disabled?: boolean
  /** Optional CSS class name */
  className?: string
}

/**
 * ExpressCheckout component that provides a quick checkout experience
 * using Apple Pay, Google Pay, or browser-saved cards.
 *
 * This component displays a section above the regular checkout form
 * with wallet payment options when available, along with an "Or pay with card"
 * divider.
 *
 * @example
 * ```tsx
 * <ExpressCheckout disabled={isLoading} />
 * ```
 */
export function ExpressCheckout({ disabled = false, className = '' }: ExpressCheckoutProps) {
  const router = useRouter()
  const { cart, clearCart, cartTotal } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)

  // Define all hooks before any conditional returns to follow Rules of Hooks
  const handlePaymentSuccess = useCallback(
    async (paymentMethodId: string) => {
      setIsProcessing(true)

      try {
        // Create a checkout session with the payment method
        const response = await fetch('/api/checkout/express', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethodId,
            items: cart.items.map((item) => ({
              productId: item.id,
              variantId: item.variantId || null,
              quantity: item.quantity,
            })),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to process payment')
        }

        const { orderId, redirectUrl } = await response.json()

        // Clear the cart
        clearCart()

        // Show success message
        toast.success('Payment successful! Redirecting to order confirmation...')

        // Redirect to order confirmation
        router.push(redirectUrl || `/order-confirmation?orderId=${orderId}`)
      } catch (error) {
        console.error('Express checkout failed:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'Payment failed. Please try again.'
        toast.error(errorMessage)
      } finally {
        setIsProcessing(false)
      }
    },
    [cart.items, clearCart, router]
  )

  const handlePaymentError = useCallback((error: Error) => {
    console.error('Payment error:', error)
    toast.error(error.message || 'Payment failed. Please try again.')
  }, [])

  // Don't render if Stripe is not configured or cart is empty
  if (!isStripeConfigured() || cart.items.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Express Checkout Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Express Checkout</h3>

        <PaymentRequestButton
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          disabled={disabled || isProcessing}
          className="w-full"
        />

        {/* Processing indicator */}
        {isProcessing && (
          <p className="text-center text-sm text-gray-500">Processing your payment...</p>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-500">Or pay with card</span>
        </div>
      </div>
    </div>
  )
}

export default ExpressCheckout
