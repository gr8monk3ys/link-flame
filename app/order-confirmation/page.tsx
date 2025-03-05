"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/providers/CartProvider";
import { Toaster } from "sonner";

function OrderConfirmationContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState({
    orderId: searchParams.get("orderId") || "N/A",
    date: new Date().toLocaleDateString(),
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  });

  // Clear the cart when the page loads
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="container py-12">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-lg space-y-8">
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center space-y-4 text-center">
            <div className="rounded-full bg-green-100 p-3 text-green-600">
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
          </div>
          
          <div className="mb-6 space-y-4 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Order Number:</span>
              <span>{orderDetails.orderId}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Order Date:</span>
              <span>{orderDetails.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Estimated Delivery:</span>
              <span>{orderDetails.estimatedDelivery}</span>
            </div>
          </div>
          
          <p className="mb-6 text-center text-sm text-muted-foreground">
            A confirmation email has been sent to your email address with all the details of your order.
          </p>
          
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
            <Button asChild className="flex-1">
              <Link href="/collections">Continue Shopping</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/account/orders">View All Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="container py-12 text-center">Loading order details...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
