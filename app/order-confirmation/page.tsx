"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/providers/CartProvider";

export default function OrderConfirmationPage() {
  const { clearCart } = useCart();

  // Clear the cart when the page loads
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="mx-auto w-fit rounded-full bg-green-100 p-3 text-green-600">
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
            className="size-8"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold">Order Confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you for your purchase. Your order has been confirmed and will be
          shipped soon.
        </p>
        <p className="text-muted-foreground">
          A confirmation email has been sent to your email address.
        </p>
        <div className="pt-4">
          <Button asChild>
            <Link href="/collections">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
