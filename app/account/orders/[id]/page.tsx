"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Check, Package, Truck, Home, CheckCircle, XCircle, ExternalLink, Gift } from "lucide-react";

interface ShippingStep {
  key: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface OrderWithTracking {
  id: string;
  amount: number;
  status: string;
  shippingStatus: string | null;
  shippingStatusLabel: string;
  shippingProgress: ShippingStep[];
  trackingNumber: string | null;
  shippingCarrier: string | null;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  shippingAddress: string | null;
  customerName: string | null;
  customerEmail: string | null;
  paymentMethod: string | null;
  createdAt: string;
  isCancelled: boolean;
  isDelivered: boolean;
  itemCount: number;
  isGift: boolean;
  giftMessage: string | null;
  giftRecipientName: string | null;
  giftRecipientEmail: string | null;
  hidePrice: boolean;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    variantSize: string | null;
    variantColor: string | null;
    variantMaterial: string | null;
    product: {
      id: string;
      image: string;
      description: string | null;
    };
    variant: {
      id: string;
      image: string | null;
    } | null;
  }>;
}

// Icon mapping for shipping steps
function getStepIcon(key: string, completed: boolean, current: boolean) {
  const baseClass = `h-6 w-6 ${completed ? "text-primary" : current ? "text-primary" : "text-muted-foreground"}`;

  switch (key) {
    case "processing":
      return <Package className={baseClass} />;
    case "shipped":
      return <Package className={baseClass} />;
    case "in_transit":
      return <Truck className={baseClass} />;
    case "out_for_delivery":
      return <Truck className={baseClass} />;
    case "delivered":
      return <Home className={baseClass} />;
    default:
      return <Package className={baseClass} />;
  }
}

export default function OrderDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const isLoaded = status !== "loading";
  const isSignedIn = !!session;
  const [order, setOrder] = useState<OrderWithTracking | null>(null);
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
      setOrder(data.data);
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
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Link href="/account/orders" className="text-sm text-primary hover:underline">
          ← Back to Orders
        </Link>
      </div>

      {/* Order Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-2xl">Order Details</CardTitle>
              <CardDescription className="mt-2">
                Order ID: {order.id}
              </CardDescription>
              <CardDescription>
                Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              {/* Payment status */}
              <Badge variant={order.status === "paid" ? "default" : "secondary"}>
                {order.status === "paid" ? <CheckCircle className="mr-1 size-3" /> : null}
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              {/* Shipping status */}
              <Badge variant={order.isCancelled ? "destructive" : order.isDelivered ? "default" : "outline"}>
                {order.isCancelled ? <XCircle className="mr-1 size-3" /> : null}
                {order.isDelivered ? <CheckCircle className="mr-1 size-3" /> : null}
                {order.shippingStatusLabel}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Shipping Progress Tracker */}
      {!order.isCancelled && order.shippingProgress && order.shippingProgress.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shipping Progress</CardTitle>
            {order.estimatedDelivery && !order.isDelivered && (
              <CardDescription>
                Estimated delivery: {format(new Date(order.estimatedDelivery), "MMMM d, yyyy")}
              </CardDescription>
            )}
            {order.deliveredAt && (
              <CardDescription className="text-green-600">
                Delivered on {format(new Date(order.deliveredAt), "MMMM d, yyyy 'at' h:mm a")}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {/* Progress Steps */}
            <div className="relative">
              <div className="flex justify-between">
                {order.shippingProgress.map((step, index) => (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`flex size-10 items-center justify-center rounded-full border-2 ${
                        step.completed
                          ? "border-primary bg-primary text-primary-foreground"
                          : step.current
                          ? "border-primary bg-background"
                          : "border-muted bg-background"
                      }`}
                    >
                      {step.completed ? (
                        <Check className="size-5" />
                      ) : (
                        getStepIcon(step.key, step.completed, step.current)
                      )}
                    </div>
                    <span className={`mt-2 text-center text-xs ${step.completed || step.current ? "font-medium" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              {/* Progress line */}
              <div className="absolute inset-x-0 top-5 -z-0 h-0.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${(order.shippingProgress.filter(s => s.completed).length / (order.shippingProgress.length - 1)) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Tracking Info */}
            {order.trackingNumber && (
              <div className="mt-6 rounded-lg bg-muted p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Tracking Number</div>
                    <div className="font-mono font-medium">{order.trackingNumber}</div>
                    {order.shippingCarrier && (
                      <div className="text-sm text-muted-foreground">via {order.shippingCarrier}</div>
                    )}
                  </div>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Track Package
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Shipped date */}
            {order.shippedAt && (
              <div className="mt-4 text-sm text-muted-foreground">
                Shipped on {format(new Date(order.shippedAt), "MMMM d, yyyy")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancelled Order Notice */}
      {order.isCancelled && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <XCircle className="size-6" />
              <div>
                <div className="font-semibold">Order Cancelled</div>
                <div className="text-sm text-muted-foreground">
                  This order has been cancelled. Please contact support if you have any questions.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gift Information */}
      {order.isGift && (
        <Card className="mb-6 border-pink-200 bg-pink-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Gift className="size-5 text-pink-600" />
              <CardTitle className="text-lg text-pink-800">Gift Order</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {order.giftRecipientName && (
                <div>
                  <div className="text-sm font-medium text-pink-800">Recipient</div>
                  <div className="text-sm text-pink-700">{order.giftRecipientName}</div>
                </div>
              )}

              {order.giftMessage && (
                <div>
                  <div className="mb-1 text-sm font-medium text-pink-800">Gift Message</div>
                  <div className="rounded-lg border border-pink-200 bg-white/70 p-3 text-sm italic text-pink-700">
                    &ldquo;{order.giftMessage}&rdquo;
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                {order.hidePrice && (
                  <div className="flex items-center gap-1 rounded-full bg-pink-100 px-2 py-1 text-xs text-pink-700">
                    <Check className="size-3" />
                    <span>Prices hidden on packing slip</span>
                  </div>
                )}
                {order.giftRecipientEmail && (
                  <div className="flex items-center gap-1 rounded-full bg-pink-100 px-2 py-1 text-xs text-pink-700">
                    <Check className="size-3" />
                    <span>Recipient will be notified</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer & Shipping Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold">Customer Information</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                {order.customerName && <div>{order.customerName}</div>}
                {order.customerEmail && <div>{order.customerEmail}</div>}
              </div>
            </div>
            {order.shippingAddress && (
              <div>
                <h3 className="mb-2 font-semibold">Shipping Address</h3>
                <div className="text-sm text-muted-foreground">
                  {order.shippingAddress}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items ({order.itemCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => {
              // Use variant image if available, otherwise product image
              const displayImage = item.variant?.image || item.product.image;
              // Build variant details string
              const variantDetails = [
                item.variantSize,
                item.variantColor,
                item.variantMaterial,
              ].filter(Boolean);

              return (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border p-4"
                >
                  <div className="relative size-20 shrink-0">
                    <Image
                      src={displayImage}
                      alt={item.title}
                      fill
                      className="rounded object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    {variantDetails.length > 0 && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {variantDetails.join(' / ')}
                      </p>
                    )}
                    {item.product.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
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
                      className="mt-2 inline-block text-sm text-primary hover:underline"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="mt-6 border-t pt-6">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>${order.amount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
