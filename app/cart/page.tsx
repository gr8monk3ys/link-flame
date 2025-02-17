"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import { createCheckout, getProductVariant } from "@/lib/shopify";
import type { CartItem } from "@/types/cart";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = items.reduce((total: number, item: CartItem) => {
    return total + item.price * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      
      // Convert cart items to Shopify line items
      const lineItems = await Promise.all(
        items.map(async (item: CartItem) => {
          const variantId = await getProductVariant(item.id);
          return {
            variantId,
            quantity: item.quantity,
          };
        })
      );

      // Create checkout and get URL
      const checkoutUrl = await createCheckout(lineItems);
      
      // Redirect to checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("[CHECKOUT_ERROR]", error);
      // You might want to show an error toast here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SignedIn>
      <div className="container py-8">
        <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>
        {items.length === 0 ? (
          <div className="flex h-[450px] w-full flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <Button onClick={() => router.push("/collections")}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="space-y-4">
                {items.map((item: CartItem) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 rounded-lg border p-4"
                  >
                    <div className="relative size-24 overflow-hidden rounded-md">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                      <p className="font-medium">{formatPrice(item.price)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                    >
                      <span className="sr-only">Remove item</span>
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
                        className="size-4"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="rounded-lg border p-6">
                <h2 className="mb-4 text-lg font-medium">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span className="text-sm text-muted-foreground">
                      Calculated at checkout
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <Button
                      className="w-full"
                      onClick={handleCheckout}
                      disabled={isLoading}
                    >
                      {isLoading ? "Loading..." : "Proceed to Checkout"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SignedIn>
  );
}
