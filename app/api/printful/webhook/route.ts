import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendShippingNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/printful/webhook?secret=...
 *
 * Printful's v1 webhooks are not signed, so the URL carries a shared secret
 * (PRINTFUL_WEBHOOK_SECRET). Register it with scripts/register-printful-webhook.mjs.
 *
 * Handled events (matched to our order by data.order.external_id):
 *   package_shipped  tracking number + carrier, order marked shipped, email sent
 *   order_failed     printfulStatus "failed" with the reason, for an admin to retry
 *   order_canceled   printfulStatus "canceled"
 *   order_put_hold / order_remove_hold / order_updated  status recorded
 */

interface PrintfulWebhookEvent {
  type?: string;
  data?: {
    reason?: string;
    order?: { id?: number; external_id?: string | null; status?: string };
    shipment?: {
      carrier?: string;
      service?: string;
      tracking_number?: string | number;
      tracking_url?: string;
    };
  };
}

function secretMatches(given: string | null): boolean {
  const expected = process.env.PRINTFUL_WEBHOOK_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!secretMatches(new URL(req.url).searchParams.get("secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: PrintfulWebhookEvent;
  try {
    event = (await req.json()) as PrintfulWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const externalId = event.data?.order?.external_id;
  if (!event.type || !externalId) {
    // Nothing we can match; acknowledge so Printful does not retry.
    return NextResponse.json({ received: true, ignored: true });
  }

  const order = await prisma.order.findUnique({
    where: { id: externalId },
    select: {
      id: true,
      customerEmail: true,
      customerName: true,
      shippingStatus: true,
      trackingNumber: true,
    },
  });
  if (!order) {
    logger.warn("Printful webhook for unknown order", { externalId, type: event.type });
    return NextResponse.json({ received: true, ignored: true });
  }

  const printfulStatus = event.data?.order?.status;

  try {
    switch (event.type) {
      case "package_shipped": {
        const shipment = event.data?.shipment ?? {};
        const trackingNumber = shipment.tracking_number != null ? String(shipment.tracking_number) : null;
        const carrier = shipment.carrier ?? null;
        const alreadyNotified = order.shippingStatus === "shipped" && order.trackingNumber === trackingNumber;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            shippingStatus: "shipped",
            shippedAt: new Date(),
            trackingNumber,
            shippingCarrier: carrier,
            printfulStatus: printfulStatus ?? "fulfilled",
            printfulError: null,
          },
        });

        if (!alreadyNotified && order.customerEmail) {
          await sendShippingNotificationEmail(order.customerEmail, {
            orderId: order.id,
            customerName: order.customerName || "Customer",
            trackingNumber,
            shippingCarrier: carrier,
          });
        }
        break;
      }
      case "order_failed":
      case "order_canceled":
      case "order_put_hold": {
        const status =
          event.type === "order_failed" ? "failed" : event.type === "order_canceled" ? "canceled" : "onhold";
        await prisma.order.update({
          where: { id: order.id },
          data: {
            printfulStatus: status,
            printfulError: (event.data?.reason || `Printful reported ${event.type}`).slice(0, 1000),
          },
        });
        logger.error("Printful order needs attention", { orderId: order.id, type: event.type });
        break;
      }
      default:
        if (printfulStatus) {
          await prisma.order.update({ where: { id: order.id }, data: { printfulStatus } });
        }
    }
  } catch (error) {
    logger.error("Printful webhook handling failed", error);
    // 500 makes Printful retry the delivery.
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
