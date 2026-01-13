"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

interface OrderWithTracking {
  id: string;
  amount: number;
  status: string;
  shippingStatus: string | null;
  shippingStatusLabel: string;
  createdAt: string;
  shippingAddress: string | null;
  customerName: string | null;
  trackingNumber: string | null;
  thumbnail: string | null;
  itemCount: number;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    product: {
      id: string;
      image: string;
      title: string;
    };
  }>;
}

// Get shipping status icon
function getShippingIcon(status: string | null) {
  switch (status) {
    case "delivered":
      return <CheckCircle className="h-4 w-4" />;
    case "shipped":
    case "in_transit":
    case "out_for_delivery":
      return <Truck className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

// Get shipping status badge variant
function getShippingBadgeVariant(status: string | null): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "delivered":
      return "default";
    case "shipped":
    case "in_transit":
    case "out_for_delivery":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const isSignedIn = !!session;
  const [orders, setOrders] = useState<OrderWithTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchOrders();
    }
  }, [isLoaded, isSignedIn, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const response = await fetch(`/api/orders?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      setOrders(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="container py-10">Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your order history.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="container py-10">Loading orders...</div>;
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

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order History</h1>
          <p className="text-muted-foreground mt-2">
            View and track your orders
          </p>
        </div>
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="all">All Orders</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {statusFilter === "all" ? "No Orders Yet" : "No Orders Found"}
            </CardTitle>
            <CardDescription>
              {statusFilter === "all"
                ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                : `No orders with status "${statusFilter}" found.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusFilter === "all" ? (
              <Link
                href="/collections"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Browse Products
              </Link>
            ) : (
              <button
                onClick={() => setStatusFilter("all")}
                className="text-sm text-primary hover:underline"
              >
                View all orders
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex gap-4">
                    {/* Order thumbnail */}
                    {order.thumbnail && (
                      <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden">
                        <Image
                          src={order.thumbnail}
                          alt="Order item"
                          fill
                          className="object-cover"
                        />
                        {order.itemCount > 1 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              +{order.itemCount - 1}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        Placed on {format(new Date(order.createdAt), "MMMM d, yyyy")}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        {/* Payment status */}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            order.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : order.status === "refunded"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        {/* Shipping status */}
                        <Badge variant={getShippingBadgeVariant(order.shippingStatus)}>
                          {getShippingIcon(order.shippingStatus)}
                          <span className="ml-1">{order.shippingStatusLabel}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${order.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {order.trackingNumber && (
                  <div className="mb-4 p-3 bg-muted rounded-md">
                    <div className="text-sm">
                      <strong>Tracking #:</strong> {order.trackingNumber}
                    </div>
                  </div>
                )}
                {order.shippingAddress && (
                  <div className="mb-4 text-sm text-muted-foreground">
                    <strong>Shipping to:</strong> {order.shippingAddress}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    View Order Details →
                  </Link>
                  {order.shippingStatus === "shipped" || order.shippingStatus === "in_transit" ? (
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Track Package
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
