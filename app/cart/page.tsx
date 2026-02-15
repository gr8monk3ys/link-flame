"use client";

import { useEffect, useState, memo, Suspense } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/providers/CartProvider";
import { useSavedItems } from "@/hooks/useSavedItems";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types/cart";
import CheckoutForm from "@/components/checkout/checkout-form";
import ErrorBoundary from "@/components/layout/error-boundary";
import { LoadingShimmer } from "@/components/ui/loading-shimmer";
import { Toaster } from "sonner";
import { CarbonNeutralBanner, CarbonNeutralShippingLine } from "@/components/sustainability";

// Lazy load non-critical components
const ProductRecommendations = dynamic(
  () => import("@/components/cart/product-recommendations"),
  { 
    ssr: false, 
    loading: () => <div className="h-48 animate-pulse rounded-md bg-muted"></div> 
  }
);

const SavedItems = dynamic(
  () => import("@/components/cart/saved-items"),
  { 
    ssr: false, 
    loading: () => <div className="h-12 animate-pulse rounded-md bg-muted"></div> 
  }
);

// Memoized cart item component to prevent unnecessary re-renders
const CartItemRow = memo(({ 
  item, 
  updateQuantity, 
  removeItem,
  saveForLater
}: { 
  item: CartItem; 
  updateQuantity: (id: string, quantity: number) => void; 
  removeItem: (id: string, variantId?: string | null, cartItemId?: string) => void;
  saveForLater: (item: CartItem) => void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSaveForLater = () => {
    setIsSaving(true);
    saveForLater(item);
    removeItem(item.id, item.variantId ?? null, item.cartItemId);
    // Reset saving state after a short delay
    setTimeout(() => setIsSaving(false), 600);
  };

  return (
    <div
      key={item.id}
      data-testid="cart-item"
      className="cart-item flex items-center space-x-4 rounded-lg border p-4"
    >
      <div className="relative size-24 overflow-hidden rounded-md">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>
      <div className="flex-1 space-y-1">
        <h3 className="font-medium">{item.title}</h3>
        <div className="flex items-center space-x-2">
          <label htmlFor={`quantity-${item.id}`} className="text-sm font-medium">
            Quantity:
          </label>
          {isUpdating ? (
            <div className="w-16 animate-pulse rounded-md border border-input bg-background px-2 py-1 text-sm">
              ...
            </div>
          ) : (
            <input
              type="number"
              id={`quantity-${item.id}`}
              min="1"
              max="99"
              className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={item.quantity}
              onChange={(e) => {
                const quantity = parseInt(e.target.value);
                if (quantity >= 1 && quantity <= 99) {
                  setIsUpdating(true);
                  updateQuantity(item.id, quantity);
                  // Reset updating state after a short delay
                  setTimeout(() => setIsUpdating(false), 600);
                }
              }}
            />
          )}
        </div>
        <p className="font-medium">{formatPrice(item.price)} each</p>
        <p className="text-sm text-muted-foreground">
          Subtotal: {formatPrice(item.price * item.quantity)}
        </p>
      </div>
      <div className="flex flex-col space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeItem(item.id, item.variantId ?? null, item.cartItemId)}
          aria-label="Remove item"
          className="h-8 px-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1 size-4"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          <span className="text-xs">Remove</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveForLater}
          disabled={isSaving}
          aria-label="Save for later"
          className="h-8 px-2 text-xs"
        >
          {isSaving ? (
            <span className="flex items-center justify-center">
              <svg className="mr-1 size-3 animate-spin" viewBox="0 0 24 24">
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
              Saving...
            </span>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1 size-3"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

CartItemRow.displayName = "CartItemRow";

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    cart,
    removeItem,
    updateQuantity,
    isLoading,
    cartTotal,
    hasInitializedCart,
    fetchCartItems
  } = useCart();
  const { saveItem } = useSavedItems();

  const items = cart.items || [];

  // Fetch cart items when the page loads
  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  // Note: Guest users can view cart but will need to sign in at checkout
  // This allows cart persistence for guests which improves conversion

  if (status === "loading") {
    return (
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="container py-8">
        <h1 className="mb-4 text-3xl font-bold">Shopping Cart</h1>
        {/* Carbon-neutral shipping banner */}
        <div className="mb-8">
          <CarbonNeutralBanner variant="compact" />
        </div>
        
        {isLoading && !hasInitializedCart ? (
          <div className="space-y-4">
            <LoadingShimmer />
            <LoadingShimmer />
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-[450px] w-full flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <Button onClick={() => router.push("/collections")}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="space-y-4">
                  {items.map((item: CartItem) => (
                    <CartItemRow 
                      key={item.id}
                      item={item}
                      updateQuantity={updateQuantity}
                      removeItem={removeItem}
                      saveForLater={saveItem}
                    />
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="rounded-lg border p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-medium">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">{cartTotal.formatted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shipping</span>
                      <span className="text-sm text-muted-foreground">
                        Calculated at checkout
                      </span>
                    </div>
                    {/* Carbon-neutral shipping line */}
                    <CarbonNeutralShippingLine />
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-lg font-medium">Total</span>
                      <span className="text-lg font-bold">{cartTotal.formatted}</span>
                    </div>
                    <div className="border-t pt-4">
                      <ErrorBoundary>
                        <CheckoutForm />
                      </ErrorBoundary>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Saved Items */}
            <div className="mt-8">
              <ErrorBoundary>
                <Suspense fallback={<div className="h-12 animate-pulse rounded-md bg-muted"></div>}>
                  <SavedItems />
                </Suspense>
              </ErrorBoundary>
            </div>
            
            {/* Product recommendations */}
            <div className="mt-12">
              <ErrorBoundary>
                <Suspense fallback={<div className="h-48 animate-pulse rounded-md bg-muted"></div>}>
                  <ProductRecommendations />
                </Suspense>
              </ErrorBoundary>
            </div>
          </>
        )}
      </div>
    </>
  );
}
