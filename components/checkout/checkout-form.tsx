"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/providers/CartProvider";
import { LoadingShimmer } from "@/components/ui/loading-shimmer";
import { InlineRedeemWidget } from "@/components/loyalty";
import { ReferralCodeInput } from "@/components/referrals/ReferralCodeInput";
import { toast } from "sonner";
import { CarbonNeutralBanner } from "@/components/sustainability";

// Form validation types
type FormErrors = {
  [key: string]: string;
};

export default function CheckoutForm() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<number>(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralDiscount, setReferralDiscount] = useState<number>(0);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    paymentMethod: "credit-card",
  });

  // Calculate referral discount amount and final total
  const referralDiscountAmount = referralDiscount > 0 ? (cartTotal.raw * referralDiscount) / 100 : 0;
  const totalDiscount = loyaltyDiscount + referralDiscountAmount;
  const finalTotal = Math.max(0, cartTotal.raw - totalDiscount);

  // Disable checkout button if cart is empty
  const isCheckoutDisabled = cart.items.length === 0 || isLoading;

  // Clear form errors when input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear error for this field
    if (formErrors[id]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    
    // Name validation
    if (!formData.firstName) errors.firstName = "First name is required";
    if (!formData.lastName) errors.lastName = "Last name is required";
    
    // Address validation
    if (!formData.address) errors.address = "Address is required";
    if (!formData.city) errors.city = "City is required";
    if (!formData.state) errors.state = "State is required";
    
    // Zip code validation
    if (!formData.zipCode) {
      errors.zipCode = "ZIP code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      errors.zipCode = "ZIP code is invalid";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Create order in the database
      const orderData = {
        ...formData,
        items: cart.items,
        total: finalTotal,
        loyaltyDiscount: loyaltyDiscount,
        referralCode: referralCode,
        referralDiscount: referralDiscountAmount,
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      // Clear the cart after successful checkout
      clearCart();
      
      // Show success message
      toast.success("Order placed successfully!");
      
      // Get the redirect URL from the response or use default
      const { redirectUrl } = await response.json();
      
      // Redirect to order confirmation page with order ID
      router.push(redirectUrl || "/order-confirmation");
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Checkout form">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-500" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email" id="email-label">Email</Label>
        <Input
          type="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          className={formErrors.email ? "border-red-500" : ""}
          aria-invalid={!!formErrors.email}
          aria-describedby={formErrors.email ? "email-error" : undefined}
          required
        />
        {formErrors.email && (
          <p className="text-xs text-red-500" id="email-error" role="alert">
            {formErrors.email}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" id="firstName-label">First name</Label>
          <Input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={handleChange}
            disabled={isLoading}
            className={formErrors.firstName ? "border-red-500" : ""}
            aria-invalid={!!formErrors.firstName}
            aria-describedby={formErrors.firstName ? "firstName-error" : undefined}
            required
          />
          {formErrors.firstName && (
            <p className="text-xs text-red-500" id="firstName-error" role="alert">
              {formErrors.firstName}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" id="lastName-label">Last name</Label>
          <Input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={handleChange}
            disabled={isLoading}
            className={formErrors.lastName ? "border-red-500" : ""}
            aria-invalid={!!formErrors.lastName}
            aria-describedby={formErrors.lastName ? "lastName-error" : undefined}
            required
          />
          {formErrors.lastName && (
            <p className="text-xs text-red-500" id="lastName-error" role="alert">
              {formErrors.lastName}
            </p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address" id="address-label">Address</Label>
        <Input
          type="text"
          id="address"
          value={formData.address}
          onChange={handleChange}
          disabled={isLoading}
          className={formErrors.address ? "border-red-500" : ""}
          aria-invalid={!!formErrors.address}
          aria-describedby={formErrors.address ? "address-error" : undefined}
          required
        />
        {formErrors.address && (
          <p className="text-xs text-red-500" id="address-error" role="alert">
            {formErrors.address}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" id="city-label">City</Label>
          <Input
            type="text"
            id="city"
            value={formData.city}
            onChange={handleChange}
            disabled={isLoading}
            className={formErrors.city ? "border-red-500" : ""}
            aria-invalid={!!formErrors.city}
            aria-describedby={formErrors.city ? "city-error" : undefined}
            required
          />
          {formErrors.city && (
            <p className="text-xs text-red-500" id="city-error" role="alert">
              {formErrors.city}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state" id="state-label">State</Label>
          <Input
            type="text"
            id="state"
            value={formData.state}
            onChange={handleChange}
            disabled={isLoading}
            className={formErrors.state ? "border-red-500" : ""}
            aria-invalid={!!formErrors.state}
            aria-describedby={formErrors.state ? "state-error" : undefined}
            required
          />
          {formErrors.state && (
            <p className="text-xs text-red-500" id="state-error" role="alert">
              {formErrors.state}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode" id="zipCode-label">ZIP code</Label>
          <Input
            type="text"
            id="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            disabled={isLoading}
            className={formErrors.zipCode ? "border-red-500" : ""}
            aria-invalid={!!formErrors.zipCode}
            aria-describedby={formErrors.zipCode ? "zipCode-error" : undefined}
            required
            pattern="^\d{5}(-\d{4})?$"
            inputMode="numeric"
          />
          {formErrors.zipCode && (
            <p className="text-xs text-red-500" id="zipCode-error" role="alert">
              {formErrors.zipCode}
            </p>
          )}
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="border-t pt-4">
        <ReferralCodeInput
          onCodeApplied={(code, discount) => {
            setReferralCode(code);
            setReferralDiscount(discount);
          }}
          onCodeRemoved={() => {
            setReferralCode(null);
            setReferralDiscount(0);
          }}
          disabled={isLoading}
        />
      </div>

      {/* Loyalty Points Redemption */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-3">Loyalty Rewards</h3>
        <InlineRedeemWidget
          onDiscountApplied={(discount) => setLoyaltyDiscount(discount)}
          maxOrderTotal={cartTotal.raw}
        />
      </div>

      {/* Show discount summary if any discount applied */}
      {totalDiscount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${cartTotal.raw.toFixed(2)}</span>
          </div>
          {referralDiscountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-700">
              <span>Referral Discount ({referralDiscount}%)</span>
              <span>-${referralDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          {loyaltyDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-700">
              <span>Loyalty Points Discount</span>
              <span>-${loyaltyDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t border-green-200 pt-2">
            <span>Total</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>
)}

      {/* Carbon Neutral Shipping Notice */}
      <div className="border-t pt-4">
        <CarbonNeutralBanner variant="compact" showLearnMore={false} />
      </div>

      <div className="space-y-2">
        <Label id="payment-method-label">Payment Method</Label>
        <div className="sr-only" id="payment-method-instructions">
          Select a payment method by pressing one of the following buttons
        </div>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-labelledby="payment-method-label" aria-describedby="payment-method-instructions">
          <Button 
            type="button" 
            variant={formData.paymentMethod === "credit-card" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: "credit-card" }))}
            disabled={isLoading}
            className="flex items-center justify-center"
            role="radio"
            aria-checked={formData.paymentMethod === "credit-card"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 size-4">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            Card
          </Button>
          <Button 
            type="button" 
            variant={formData.paymentMethod === "paypal" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: "paypal" }))}
            disabled={isLoading}
            role="radio"
            aria-checked={formData.paymentMethod === "paypal"}
          >
            PayPal
          </Button>
          <Button 
            type="button" 
            variant={formData.paymentMethod === "apple-pay" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: "apple-pay" }))}
            disabled={isLoading}
            role="radio"
            aria-checked={formData.paymentMethod === "apple-pay"}
          >
            Apple Pay
          </Button>
          <Button 
            type="button" 
            variant={formData.paymentMethod === "google-pay" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: "google-pay" }))}
            disabled={isLoading}
            role="radio"
            aria-checked={formData.paymentMethod === "google-pay"}
          >
            Google Pay
          </Button>
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push("/cart")}
          disabled={isLoading}
        >
          Back to cart
        </Button>
        <Button 
          type="submit" 
          disabled={isCheckoutDisabled}
          className="relative"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="mr-2 size-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
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
            "Complete Order"
          )}
        </Button>
      </div>
    </form>
  );
}
