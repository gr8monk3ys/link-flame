import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getBaseUrl } from "@/lib/url";
import { FULFILLMENT } from "@/lib/fulfillment";

/**
 * Print-on-demand fulfillment through the Printful API (v1).
 *
 * After Stripe reports an order paid, every "printful" line is sent to
 * Printful as one order whose external_id is our order id. By default the
 * order is created as a draft: Printful does not charge or print it until
 * someone confirms it in the Printful dashboard. Set PRINTFUL_AUTO_CONFIRM=true
 * to submit for fulfillment immediately.
 *
 * Env: PRINTFUL_API_KEY (private token), PRINTFUL_STORE_ID (needed when the
 * token covers more than one store), PRINTFUL_AUTO_CONFIRM,
 * PRINTFUL_WEBHOOK_SECRET (shared secret in the webhook URL).
 */

const API_BASE = "https://api.printful.com";

export function isPrintfulConfigured(): boolean {
  return Boolean(process.env.PRINTFUL_API_KEY);
}

export interface ShippingDetails {
  name?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
}

export interface PrintfulRecipient {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code?: string;
  country_code: string;
  zip: string;
  email?: string;
}

export interface PrintfulOrderItem {
  variant_id: number;
  quantity: number;
  retail_price: string;
  name: string;
  external_id: string;
  files: Array<{ type: "front"; url: string }>;
}

export function toPrintfulRecipient(
  details: ShippingDetails | null | undefined,
  email?: string | null
): PrintfulRecipient | null {
  const a = details?.address;
  if (!details?.name || !a?.line1 || !a.city || !a.postal_code || !a.country) return null;
  return {
    name: details.name,
    address1: a.line1,
    ...(a.line2 ? { address2: a.line2 } : {}),
    city: a.city,
    ...(a.state ? { state_code: a.state } : {}),
    country_code: a.country,
    zip: a.postal_code,
    ...(email ? { email } : {}),
  };
}

/** Absolute URL Printful can fetch the print file from. */
export function printFileUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${getBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

type OrderForPrintful = {
  id: string;
  customerEmail: string | null;
  shippingDetails: unknown;
  items: Array<{
    id: string;
    quantity: number;
    price: unknown;
    title: string;
    product: { fulfillment: string; printfulVariantId: number | null; printFile: string | null };
    variant: { printfulVariantId: number | null } | null;
  }>;
};

export function buildPrintfulItems(order: OrderForPrintful): PrintfulOrderItem[] {
  const items: PrintfulOrderItem[] = [];
  for (const item of order.items) {
    if (item.product.fulfillment !== FULFILLMENT.PRINTFUL) continue;
    const variantId = item.variant?.printfulVariantId ?? item.product.printfulVariantId;
    if (!variantId || !item.product.printFile) {
      throw new Error(`Printful mapping missing for "${item.title}" (variant id or print file)`);
    }
    items.push({
      variant_id: variantId,
      quantity: item.quantity,
      retail_price: Number(item.price).toFixed(2),
      name: item.title,
      external_id: item.id,
      files: [{ type: "front", url: printFileUrl(item.product.printFile) }],
    });
  }
  return items;
}

async function printfulRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
    "Content-Type": "application/json",
  };
  if (process.env.PRINTFUL_STORE_ID) headers["X-PF-Store-Id"] = process.env.PRINTFUL_STORE_ID;

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => null)) as
    | { code?: number; result?: unknown; error?: { message?: string } }
    | null;
  if (!response.ok) {
    const message =
      body?.error?.message || (typeof body?.result === "string" ? body.result : "") || response.statusText;
    const error = new Error(`Printful ${response.status}: ${message}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return body?.result as T;
}

export type PrintfulSubmitResult =
  | { status: "skipped"; reason: string }
  | { status: "submitted"; printfulOrderId: string; printfulStatus: string }
  | { status: "failed"; error: string };

/**
 * Sends the order's print-on-demand lines to Printful. Safe to call more
 * than once: an order that already has a Printful id is left alone, and a
 * 409 (external_id exists) is resolved by looking the order up.
 * Never throws; failures are stored on the order for an admin to retry.
 */
export async function submitPrintfulOrder(orderId: string): Promise<PrintfulSubmitResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      customerEmail: true,
      shippingDetails: true,
      printfulOrderId: true,
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          title: true,
          product: { select: { fulfillment: true, printfulVariantId: true, printFile: true } },
          variant: { select: { printfulVariantId: true } },
        },
      },
    },
  });

  if (!order) return { status: "failed", error: "Order not found" };
  if (order.printfulOrderId) {
    return { status: "submitted", printfulOrderId: order.printfulOrderId, printfulStatus: "existing" };
  }
  if (!order.items.some((i) => i.product.fulfillment === FULFILLMENT.PRINTFUL)) {
    return { status: "skipped", reason: "no print-on-demand items" };
  }

  const fail = async (error: string): Promise<PrintfulSubmitResult> => {
    await prisma.order.update({
      where: { id: order.id },
      data: { printfulStatus: "failed", printfulError: error.slice(0, 1000) },
    });
    logger.error("Printful submission failed", { orderId: order.id, error });
    return { status: "failed", error };
  };

  if (order.status !== "paid") return fail(`Order status is ${order.status}, not paid`);
  if (!isPrintfulConfigured()) return fail("PRINTFUL_API_KEY is not set");

  const recipient = toPrintfulRecipient(order.shippingDetails as ShippingDetails, order.customerEmail);
  if (!recipient) return fail("Order has no complete shipping address");

  let items: PrintfulOrderItem[];
  try {
    items = buildPrintfulItems(order);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }

  const confirm = process.env.PRINTFUL_AUTO_CONFIRM === "true";
  try {
    let result: { id: number; status: string };
    try {
      result = await printfulRequest<{ id: number; status: string }>(
        `/orders?confirm=${confirm ? "true" : "false"}`,
        {
          method: "POST",
          body: JSON.stringify({
            external_id: order.id,
            shipping: "STANDARD",
            recipient,
            items,
          }),
        }
      );
    } catch (error) {
      if ((error as { status?: number }).status !== 409) throw error;
      result = await printfulRequest<{ id: number; status: string }>(`/orders/@${order.id}`);
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        printfulOrderId: String(result.id),
        printfulStatus: result.status,
        printfulError: null,
      },
    });
    logger.info("Printful order created", {
      orderId: order.id,
      printfulOrderId: result.id,
      printfulStatus: result.status,
    });
    return { status: "submitted", printfulOrderId: String(result.id), printfulStatus: result.status };
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
