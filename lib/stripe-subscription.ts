import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe-server";
import { logger } from "@/lib/logger";
import { getBaseUrl } from "@/lib/url";
import {
  type SubscriptionFrequency,
  calculateNextDeliveryDate,
} from "@/lib/subscriptions";

export const FREQUENCY_TO_STRIPE_INTERVAL: Record<
  SubscriptionFrequency,
  { interval: "week" | "month"; intervalCount: number }
> = {
  WEEKLY: { interval: "week", intervalCount: 1 },
  BIWEEKLY: { interval: "week", intervalCount: 2 },
  MONTHLY: { interval: "month", intervalCount: 1 },
  BIMONTHLY: { interval: "month", intervalCount: 2 },
};

export interface SubscriptionCheckoutItemInput {
  subscriptionItemId: string;
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface SubscriptionCheckoutResult {
  session: Stripe.Checkout.Session;
  customerId: string;
  priceMappings: Array<{ subscriptionItemId: string; priceId: string }>;
}

export type SubscriptionInvoiceContext = Prisma.SubscriptionGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        name: true;
      };
    };
    items: {
      include: {
        product: true;
        variant: true;
      };
    };
  };
}>;

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }
  if (!user.email) {
    throw new Error("User email is required for subscription billing");
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: {
      userId: user.id,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customer.id,
    },
  });

  logger.info("Created Stripe customer for subscription user", {
    userId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

export async function archiveStripePrices(priceIds: string[]): Promise<void> {
  if (priceIds.length === 0) {
    return;
  }

  const stripe = getStripe();
  for (const priceId of priceIds) {
    try {
      await stripe.prices.update(priceId, { active: false });
    } catch (error) {
      logger.error("Failed to archive Stripe price", error, { priceId });
    }
  }
}

export async function createSubscriptionCheckout(
  userId: string,
  subscriptionId: string,
  frequency: SubscriptionFrequency,
  items: SubscriptionCheckoutItemInput[]
): Promise<SubscriptionCheckoutResult> {
  if (items.length === 0) {
    throw new Error("At least one subscription item is required");
  }

  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(userId);
  const recurring = FREQUENCY_TO_STRIPE_INTERVAL[frequency];
  if (!recurring) {
    throw new Error(`Unsupported subscription frequency: ${frequency}`);
  }

  const createdPriceIds: string[] = [];
  const priceMappings: Array<{ subscriptionItemId: string; priceId: string }> = [];

  try {
    for (const item of items) {
      const unitAmount = Math.round(item.unitPrice * 100);
      if (unitAmount <= 0) {
        throw new Error(`Invalid subscription unit amount for item ${item.subscriptionItemId}`);
      }

      const price = await stripe.prices.create({
        currency: "usd",
        unit_amount: unitAmount,
        recurring: {
          interval: recurring.interval,
          interval_count: recurring.intervalCount,
        },
        product_data: {
          name: item.title,
          metadata: {
            userId,
            subscriptionId,
            subscriptionItemId: item.subscriptionItemId,
          },
        },
        metadata: {
          userId,
          subscriptionId,
          subscriptionItemId: item.subscriptionItemId,
        },
      });

      createdPriceIds.push(price.id);
      priceMappings.push({
        subscriptionItemId: item.subscriptionItemId,
        priceId: price.id,
      });
    }

    const quantityByItem = new Map(items.map((item) => [item.subscriptionItemId, item.quantity]));
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: priceMappings.map((mapping) => ({
        price: mapping.priceId,
        quantity: quantityByItem.get(mapping.subscriptionItemId) || 1,
      })),
      metadata: {
        userId,
        subscriptionId,
      },
      subscription_data: {
        metadata: {
          userId,
          subscriptionId,
        },
      },
      success_url: `${getBaseUrl()}/account/subscriptions?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/account/subscriptions?subscription=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return {
      session,
      customerId,
      priceMappings,
    };
  } catch (error) {
    await archiveStripePrices(createdPriceIds);
    throw error;
  }
}

function buildOrderItemTitle(item: SubscriptionInvoiceContext["items"][number]): string {
  let title = item.product.title;
  if (item.variant) {
    const parts = [item.variant.size, item.variant.color, item.variant.material].filter(Boolean);
    if (parts.length > 0) {
      title += ` (${parts.join(", ")})`;
    }
  }
  return title;
}

async function decrementSubscriptionOrderInventory(
  tx: Prisma.TransactionClient,
  items: SubscriptionInvoiceContext["items"]
) {
  for (const item of items) {
    if (item.variantId) {
      const result = await tx.productVariant.updateMany({
        where: {
          id: item.variantId,
          inventory: { gte: item.quantity },
        },
        data: {
          inventory: { decrement: item.quantity },
        },
      });
      if (result.count === 0) {
        throw new Error(`Insufficient variant inventory for ${item.variantId}`);
      }
      continue;
    }

    const result = await tx.product.updateMany({
      where: {
        id: item.productId,
        inventory: { gte: item.quantity },
      },
      data: {
        inventory: { decrement: item.quantity },
      },
    });
    if (result.count === 0) {
      throw new Error(`Insufficient product inventory for ${item.productId}`);
    }
  }
}

export async function createOrderFromSubscriptionInvoice(
  subscription: SubscriptionInvoiceContext,
  invoice: Stripe.Invoice
): Promise<{ order: OrderWithItems; created: boolean }> {
  if (!invoice.id) {
    throw new Error("Invoice id is required");
  }

  const existing = await prisma.subscriptionOrder.findUnique({
    where: { stripeInvoiceId: invoice.id },
    include: {
      order: {
        include: {
          items: true,
        },
      },
    },
  });
  if (existing) {
    return {
      order: existing.order,
      created: false,
    };
  }

  const fallbackTotal = subscription.items.reduce((sum, item) => {
    const discountedUnit =
      Number(item.priceAtSubscription) * (1 - item.discountPercent / 100);
    return sum + discountedUnit * item.quantity;
  }, 0);
  const invoiceAmount = (invoice.amount_paid ?? invoice.amount_due ?? 0) / 100;
  const orderAmount = invoiceAmount > 0 ? invoiceAmount : fallbackTotal;

  try {
    return await prisma.$transaction(async (tx) => {
      await decrementSubscriptionOrderInventory(tx, subscription.items);

      const order = await tx.order.create({
        data: {
          userId: subscription.userId,
          amount: orderAmount,
          status: "paid",
          paymentMethod: "stripe_subscription",
          customerEmail: subscription.user.email,
          customerName: subscription.user.name,
          subscriptionId: subscription.id,
          items: {
            create: subscription.items.map((item) => {
              const discountedUnit =
                Number(item.priceAtSubscription) * (1 - item.discountPercent / 100);
              return {
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: Math.round(discountedUnit * 100) / 100,
                title: buildOrderItemTitle(item),
                variantSku: item.variant?.sku || null,
                variantSize: item.variant?.size || null,
                variantColor: item.variant?.color || null,
                variantMaterial: item.variant?.material || null,
              };
            }),
          },
        },
        include: {
          items: true,
        },
      });

      await tx.subscriptionOrder.create({
        data: {
          subscriptionId: subscription.id,
          orderId: order.id,
          stripeInvoiceId: invoice.id as string,
        },
      });

      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          stripeStatus: "active",
          paymentFailedCount: 0,
          paymentFailedAt: null,
          lastDeliveryDate: new Date(),
          nextDeliveryDate: calculateNextDeliveryDate(
            subscription.frequency as SubscriptionFrequency
          ),
        },
      });

      return {
        order,
        created: true,
      };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicate = await prisma.subscriptionOrder.findUnique({
        where: { stripeInvoiceId: invoice.id },
        include: {
          order: {
            include: {
              items: true,
            },
          },
        },
      });
      if (duplicate) {
        return {
          order: duplicate.order,
          created: false,
        };
      }
    }
    throw error;
  }
}
