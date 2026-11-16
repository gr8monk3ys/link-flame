"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/providers/CartProvider";
import { Gift, Check, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface OrderDownload {
  url: string;
  productTitle: string;
  filename: string;
  sizeBytes: number;
  downloadsLeft: number;
}

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
  shipsSomething: boolean;
  downloads: OrderDownload[];
}

// Stripe redirects here as soon as the payment succeeds; the webhook that
// marks the order paid and creates the download links can land a moment
// later. Poll briefly instead of showing an empty order.
const POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 2000;

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function OrderConfirmationContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  const fetchOrderDetails = useCallback(async (): Promise<OrderDetails | null> => {
    if (!sessionId) return null;
    try {
      const response = await fetch(
        `/api/orders/by-session?session_id=${encodeURIComponent(sessionId)}`
      );
      if (!response.ok) return null;
      const data = await response.json();
      return (data.data as OrderDetails) ?? null;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch order details:", error);
      }
      return null;
    }
  }, [sessionId]);

  useEffect(() => {
    clearCart();
    if (!sessionId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async (attempt: number) => {
      const order = await fetchOrderDetails();
      if (cancelled) return;
      if (order) setOrderDetails(order);
      const settled = order && order.status !== "pending";
      if (settled || attempt + 1 >= POLL_ATTEMPTS) {
        setLoading(false);
        return;
      }
      timer = setTimeout(() => poll(attempt + 1), POLL_INTERVAL_MS);
    };
    poll(0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [clearCart, fetchOrderDetails, sessionId]);

  const orderDate = formatDate(orderDetails?.createdAt ?? new Date());
  const shipsSomething = orderDetails?.shipsSomething ?? true;
  const downloads = orderDetails?.downloads ?? [];
  const estimatedDelivery = orderDetails?.estimatedDelivery
    ? formatDate(orderDetails.estimatedDelivery)
    : "5–10 business days";

  const orderId = orderDetails?.id
    ? `#${orderDetails.id.slice(0, 8)}`
    : searchParams.get("orderId") || "N/A";

  const lead = !orderDetails
    ? "Thank you for your purchase."
    : shipsSomething && downloads.length > 0
      ? "Thank you. Your guides are ready below. Printed items are made to order and usually ship within 2–5 business days."
      : shipsSomething
        ? "Thank you. Your items are printed to order and usually ship within 2–5 business days. We email you the tracking number."
        : "Thank you. Your guides are ready to download below.";

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="rounded-lg border border-border bg-card p-8">
          <div className="mb-6 flex flex-col items-center space-y-4 text-center">
            <div className="rounded-full border border-primary p-3 text-primary">
              <Check className="size-8" aria-hidden="true" />
            </div>
            <h1 className="font-display text-3xl font-semibold">Order confirmed</h1>
            <p className="text-muted-foreground">{lead}</p>
          </div>

          <dl className="mb-6 font-mono text-sm">
            <div className="flex justify-between border-b border-border py-2">
              <dt className="label-mono">Order number</dt>
              <dd>{orderId}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-2">
              <dt className="label-mono">Order date</dt>
              <dd suppressHydrationWarning>{orderDate}</dd>
            </div>
            {shipsSomething && (
              <div className="flex justify-between border-b border-border py-2">
                <dt className="label-mono">Estimated delivery</dt>
                <dd suppressHydrationWarning>{estimatedDelivery}</dd>
              </div>
            )}
          </dl>

          {downloads.length > 0 && (
            <section aria-labelledby="downloads-heading" className="mb-6">
              <h2 id="downloads-heading" className="mb-3 font-display text-xl font-semibold">
                Your downloads
              </h2>
              <ul className="divide-y divide-border border-y border-border">
                {downloads.map((download) => (
                  <li key={download.url} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{download.productTitle}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {download.filename} · {formatSize(download.sizeBytes)} ·{" "}
                        {download.downloadsLeft} downloads left
                      </p>
                    </div>
                    <a
                      href={download.url}
                      className="cta-secondary inline-flex shrink-0 items-center gap-2"
                      download
                    >
                      <Download className="size-4" aria-hidden="true" />
                      PDF
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                The same links are in your confirmation email.
              </p>
            </section>
          )}

          {loading && downloads.length === 0 && (
            <p role="status" className="mb-6 text-center text-sm text-muted-foreground">
              Confirming your payment…
            </p>
          )}

          {orderDetails?.isGift && (
            <div className="mb-6 space-y-3 rounded-lg border border-border bg-muted p-4">
              <div className="flex items-center gap-2 text-primary">
                <Gift className="size-5" aria-hidden="true" />
                <span className="font-medium">Gift order</span>
              </div>

              {orderDetails.giftRecipientName && (
                <div className="text-sm">
                  <span className="font-medium">Recipient: </span>
                  <span>{orderDetails.giftRecipientName}</span>
                </div>
              )}

              {orderDetails.giftMessage && (
                <div className="text-sm">
                  <span className="mb-1 block font-medium">Gift message:</span>
                  <p className="rounded border border-border bg-card p-3 italic text-muted-foreground">
                    &ldquo;{orderDetails.giftMessage}&rdquo;
                  </p>
                </div>
              )}

              {orderDetails.hidePrice && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-primary" aria-hidden="true" />
                  <span>Prices will be hidden on the packing slip</span>
                </div>
              )}

              {orderDetails.giftRecipientEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-primary" aria-hidden="true" />
                  <span>Gift recipient will be notified when shipped</span>
                </div>
              )}
            </div>
          )}

          <p className="mb-6 text-center text-sm text-muted-foreground">
            A confirmation email is on its way with the details of your order.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/collections" className="cta-primary flex-1 text-center">
              Continue shopping
            </Link>
            <Link href="/account/orders" className="cta-secondary flex-1 text-center">
              View all orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-12 text-center" role="status">
          Loading order details…
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
