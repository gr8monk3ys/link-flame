"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/providers/CartProvider";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types/cart";
import CheckoutForm from "@/components/checkout/checkout-form";
import ErrorBoundary from "@/components/layout/error-boundary";
import { LoadingShimmer } from "@/components/ui/loading-shimmer";
import { Toaster } from "sonner";
import { CarbonNeutralBanner, CarbonNeutralShippingLine } from "@/components/sustainability";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    cart,
    isLoading,
    cartTotal,
    hasInitializedCart,
    fetchCartItems
  } = useCart();

  const items = cart.items || [];

  // Fetch cart items when the page loads
  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/checkout");
    }
  }, [status, router]);

  // Note: We don't redirect to cart when empty - we show the empty state message instead
  // This allows users to access the checkout page even if their cart is empty

  if (status === "loading") {
    return (
      <div className="container flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="container py-8">
        <h1 className="mb-4 text-3xl font-bold">Checkout</h1>
        
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
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Checkout Form - Left Side */}
            <div className="lg:col-span-7">
              <ErrorBoundary>
                <CheckoutForm />
              </ErrorBoundary>
            </div>
            
            {/* Order Summary - Right Side */}
            <div className="lg:col-span-5">
              <div className="rounded-lg border p-6 shadow-sm" data-testid="order-summary">
                <h2 className="mb-4 text-lg font-medium">Order Summary</h2>
                
                {/* Cart Items */}
                <div className="space-y-4 border-b pb-4">
                  {items.map((item: CartItem) => (
                    <div 
                      key={item.id} 
                      className="flex items-center space-x-4"
                      data-testid="checkout-item"
                    >
                      <div className="relative size-16 overflow-hidden rounded-md">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Totals */}
                <div className="space-y-4 pt-4">
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
                  <div className="flex items-center justify-between border-t pt-4" data-testid="total">
                    <span className="text-lg font-medium">Total</span>
                    <span className="text-lg font-bold">{cartTotal.formatted}</span>
                  </div>
                </div>
                
                {/* Edit Cart Link */}
                <div className="mt-4 text-center">
                  <Button 
                    variant="link" 
                    onClick={() => router.push("/cart")}
                    className="text-sm"
                  >
                    Edit Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
