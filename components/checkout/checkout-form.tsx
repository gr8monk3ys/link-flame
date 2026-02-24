"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/providers/CartProvider";
import { LoadingShimmer } from "@/components/ui/loading-shimmer";
import { toast } from "sonner";
import { CarbonNeutralBanner } from "@/components/sustainability";
import { ExpressCheckout } from "./ExpressCheckout";
import { GiftOptions, GiftOptionsData } from "./GiftOptions";
import {
  DiscountSection,
  DEFAULT_CHECKOUT_DISCOUNT_STATE,
  type CheckoutDiscountState,
} from "./DiscountSection";

// Form validation types
type FormErrors = {
  [key: string]: string;
};

interface CheckoutFormProps {
  onDiscountChange?: (discounts: CheckoutDiscountState) => void;
}

export default function CheckoutForm({ onDiscountChange }: CheckoutFormProps) {
  const router = useRouter();
  const { cart, cartTotal } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [giftOptions, setGiftOptions] = useState<GiftOptionsData>({
    isGift: false,
    giftMessage: "",
    giftRecipientName: "",
    giftRecipientEmail: "",
    hidePrice: false,
  });
  const [discounts, setDiscounts] = useState<CheckoutDiscountState>(
    DEFAULT_CHECKOUT_DISCOUNT_STATE
  );
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Disable checkout button if cart is empty
  const isCheckoutDisabled = cart.items.length === 0 || isLoading;

  // Fetch CSRF token on mount
  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await fetch('/api/csrf');
      const data = await response.json();
      if (data.token) {
        setCsrfToken(data.token);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch CSRF token:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchCsrfToken();
  }, [fetchCsrfToken]);

  const handleDiscountChange = useCallback(
    (nextDiscounts: CheckoutDiscountState) => {
      setDiscounts(nextDiscounts);
      onDiscountChange?.(nextDiscounts);
    },
    [onDiscountChange]
  );

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
        total: cartTotal.raw,
        // Gift options
        isGift: giftOptions.isGift,
        giftMessage: giftOptions.giftMessage,
        giftRecipientName: giftOptions.giftRecipientName,
        giftRecipientEmail: giftOptions.giftRecipientEmail,
        hidePrice: giftOptions.hidePrice,
        loyaltyPointsToRedeem: discounts.loyaltyPointsToRedeem,
        giftCardCode: discounts.giftCardCode,
        giftCardAmount: discounts.giftCardAmount,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create order");
      }

      // Get the Stripe session URL from the response
      const { sessionUrl } = await response.json();

      if (sessionUrl) {
        // Redirect to Stripe Checkout — cart stays intact until payment succeeds.
        // The order-confirmation page (or webhook) clears the cart after payment.
        window.location.href = sessionUrl;
      } else {
        throw new Error("No checkout session URL returned");
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error submitting form:", error);
      }
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Express Checkout Section (Apple Pay / Google Pay) */}
      <ExpressCheckout disabled={isLoading} />

      {/* Standard Checkout Form */}
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

      {/* Gift Options Section */}
      <div className="border-t pt-4">
        <GiftOptions
          value={giftOptions}
          onChange={setGiftOptions}
          disabled={isLoading}
        />
      </div>

      <div className="border-t pt-4">
        <DiscountSection
          cartTotal={cartTotal.raw}
          disabled={isLoading}
          onDiscountChange={handleDiscountChange}
        />
      </div>

      {/* Carbon Neutral Shipping Notice */}
      <div className="border-t pt-4">
        <CarbonNeutralBanner variant="compact" showLearnMore={false} />
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
    </div>
  );
}
