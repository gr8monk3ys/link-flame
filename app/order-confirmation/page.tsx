"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/providers/CartProvider";
import { Toaster } from "sonner";
import { Gift, Check } from "lucide-react";

interface OrderDetails {
  id: string;
  amount: number;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  shippingAddress: string | null;
  createdAt: string;
  estimatedDelivery: string | null;
  isGift: boolean;
  giftMessage: string | null;
  giftRecipientName: string | null;
  giftRecipientEmail: string | null;
  hidePrice: boolean;
  itemCount: number;
}

function OrderConfirmationContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  // Fetch order details from API
  const fetchOrderDetails = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/orders/by-session?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Clear the cart and fetch order details when the page loads
  useEffect(() => {
    clearCart();
    fetchOrderDetails();
  }, [clearCart, fetchOrderDetails]);

  // Format dates for display
  const orderDate = orderDetails?.createdAt
    ? new Date(orderDetails.createdAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  const estimatedDelivery = orderDetails?.estimatedDelivery
    ? new Date(orderDetails.estimatedDelivery).toLocaleDateString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

  const orderId = orderDetails?.id
    ? `#${orderDetails.id.slice(0, 8)}`
    : searchParams.get("orderId") || "N/A";

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
              <span>{orderId}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Order Date:</span>
              <span>{orderDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Estimated Delivery:</span>
              <span>{estimatedDelivery}</span>
            </div>
          </div>

          {/* Gift Message Section */}
          {orderDetails?.isGift && (
            <div className="mb-6 space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <Gift className="size-5" aria-hidden="true" />
                <span className="font-medium">Gift Order</span>
              </div>

              {orderDetails.giftRecipientName && (
                <div className="text-sm">
                  <span className="font-medium">Recipient: </span>
                  <span>{orderDetails.giftRecipientName}</span>
                </div>
              )}

              {orderDetails.giftMessage && (
                <div className="text-sm">
                  <span className="mb-1 block font-medium">Gift Message:</span>
                  <p className="rounded border border-green-200 bg-white p-3 italic text-muted-foreground">
                    &ldquo;{orderDetails.giftMessage}&rdquo;
                  </p>
                </div>
              )}

              {orderDetails.hidePrice && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="size-4" aria-hidden="true" />
                  <span>Prices will be hidden on the packing slip</span>
                </div>
              )}

              {orderDetails.giftRecipientEmail && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="size-4" aria-hidden="true" />
                  <span>Gift recipient will be notified when shipped</span>
                </div>
              )}
            </div>
          )}

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
