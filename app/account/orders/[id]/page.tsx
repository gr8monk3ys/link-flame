"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Order } from "@/types";

export default function OrderDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const isLoaded = status !== "loading";
  const isSignedIn = !!session;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.status === 404) {
        notFound();
      }
      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }
      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isLoaded && isSignedIn && orderId) {
      fetchOrder();
    }
  }, [isLoaded, isSignedIn, orderId, fetchOrder]);

  if (!isLoaded || loading) {
    return <div className="container py-10">Loading order details...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view order details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="container py-10 max-w-4xl">
      <div className="mb-6">
        <Link href="/account/orders" className="text-sm text-primary hover:underline">
          ← Back to Orders
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Order Details</CardTitle>
              <CardDescription className="mt-2">
                Order ID: {order.id}
              </CardDescription>
              <CardDescription>
                Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                order.status === "paid"
                  ? "bg-green-100 text-green-800"
                  : order.status === "processing"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                {order.customerName && <div>{order.customerName}</div>}
                {order.customerEmail && <div>{order.customerEmail}</div>}
              </div>
            </div>
            {order.shippingAddress && (
              <div>
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <div className="text-sm text-muted-foreground">
                  {order.shippingAddress}
                </div>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="font-semibold mb-2">Payment Information</h3>
            <div className="text-sm text-muted-foreground">
              {order.paymentMethod && <div>Method: {order.paymentMethod}</div>}
              <div className="mt-1 font-semibold text-lg text-foreground">
                Total: ${order.amount.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 border rounded-lg"
              >
                <div className="relative size-20 shrink-0">
                  <Image
                    src={item.product.image}
                    alt={item.title}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.title}</h4>
                  {item.product.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {item.product.description}
                    </p>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground">
                    Quantity: {item.quantity} × ${item.price.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  <Link
                    href={`/products/${item.product.id}`}
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>${order.amount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
