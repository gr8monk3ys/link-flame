"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/types";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const isLoaded = status !== "loading";
  const isSignedIn = !!session;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchOrders();
    }
  }, [isLoaded, isSignedIn]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      setOrders(data.orders);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Order History</h1>
        <p className="text-muted-foreground mt-2">
          View and track your orders
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Orders Yet</CardTitle>
            <CardDescription>
              You haven&apos;t placed any orders yet. Start shopping to see your orders here!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/collections"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse Products
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      Placed on {format(new Date(order.createdAt), "MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${order.amount.toFixed(2)}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {order.shippingAddress && (
                  <div className="mb-4 text-sm text-muted-foreground">
                    <strong>Shipping to:</strong> {order.shippingAddress}
                  </div>
                )}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Order Items:</h4>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center border-b pb-2 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-muted-foreground">
                            Quantity: {item.quantity}
                          </div>
                        </div>
                      </div>
                      <div className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Order Details →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
