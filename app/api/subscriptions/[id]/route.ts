import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerAuth } from '@/lib/auth';
import { validateCsrfToken } from '@/lib/csrf';
import { getStripe } from '@/lib/stripe-server';
import { logger } from '@/lib/logger';
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  errorResponse,
  handleApiError,
  rateLimitErrorResponse,
} from '@/lib/api-response';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import {
  calculateNextDeliveryDate,
  getDiscountForFrequency,
  canModifySubscription,
  isValidFrequency,
  SubscriptionStatus,
  SubscriptionFrequency,
} from '@/lib/subscriptions';
import {
  FREQUENCY_TO_STRIPE_INTERVAL,
  archiveStripePrices,
} from '@/lib/stripe-subscription';

export const dynamic = 'force-dynamic'

// Validation schema for updating subscription
const updateSubscriptionSchema = z.object({
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY']).optional(),
  status: z.enum(['ACTIVE', 'PAUSED']).optional(), // Cannot set to CANCELLED via PATCH
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

function buildSubscriptionItemTitle(item: {
  product: { title: string };
  variant: { size: string | null; color: string | null; material: string | null } | null;
}): string {
  if (!item.variant) {
    return item.product.title;
  }

  const variantSuffix = [item.variant.size, item.variant.color, item.variant.material]
    .filter(Boolean)
    .join(', ');

  return variantSuffix ? `${item.product.title} (${variantSuffix})` : item.product.title;
}

/**
 * GET /api/subscriptions/[id]
 * Get a specific subscription by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting (standard: 10 req/10s)
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(`subscription-get:${identifier}`);
    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const { userId } = await getServerAuth();
    const { id } = await params;

    if (!userId) {
      return unauthorizedResponse('Please sign in to view your subscription');
    }

    // Find the subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                description: true,
                image: true,
                price: true,
                salePrice: true,
                isSubscribable: true,
                inventory: true,
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                size: true,
                color: true,
                colorCode: true,
                material: true,
                price: true,
                salePrice: true,
                image: true,
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      return notFoundResponse('Subscription');
    }

    // Verify ownership
    if (subscription.userId !== userId) {
      return forbiddenResponse('You do not have access to this subscription');
    }

    return successResponse(subscription);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/subscriptions/[id]
 * Update subscription frequency, status (pause/resume)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting (standard: 10 req/10s)
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(`subscription-update:${identifier}`);
    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    // CSRF protection
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    const { userId } = await getServerAuth();
    const { id } = await params;

    if (!userId) {
      return unauthorizedResponse('Please sign in to update your subscription');
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { frequency, status } = validation.data;

    // Find the subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
            variant: {
              select: {
                size: true,
                color: true,
                material: true,
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      return notFoundResponse('Subscription');
    }

    // Verify ownership
    if (subscription.userId !== userId) {
      return forbiddenResponse('You do not have access to this subscription');
    }

    // Check if subscription can be modified
    if (!canModifySubscription(subscription.status as SubscriptionStatus)) {
      return forbiddenResponse('Subscription cannot be modified in its current state');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const stripe = getStripe();
    const needsFrequencyUpdate =
      Boolean(frequency) &&
      isValidFrequency(frequency as string) &&
      frequency !== subscription.frequency;
    const needsStatusUpdate = Boolean(status) && status !== subscription.status;
    const oldStripePriceIds = subscription.items
      .map((item) => item.stripePriceId)
      .filter((value): value is string => Boolean(value));

    if (!needsFrequencyUpdate && !needsStatusUpdate) {
      const currentSubscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  image: true,
                  price: true,
                  salePrice: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  sku: true,
                  size: true,
                  color: true,
                  colorCode: true,
                  material: true,
                  price: true,
                  salePrice: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!currentSubscription) {
        return notFoundResponse('Subscription');
      }

      return successResponse(currentSubscription);
    }

    const newStripePriceByItemId = new Map<string, string>();
    const createdStripePriceIds: string[] = [];
    let newDiscountPercent: number | null = null;
    let stripeStatusToPersist: string | null = null;

    // Handle frequency change
    if (needsFrequencyUpdate) {
      const nextFrequency = frequency as SubscriptionFrequency;
      newDiscountPercent = getDiscountForFrequency(nextFrequency);

      updateData.frequency = nextFrequency;
      updateData.nextDeliveryDate = calculateNextDeliveryDate(
        nextFrequency,
        subscription.lastDeliveryDate || new Date()
      );

      if (subscription.stripeSubscriptionId) {
        const recurring = FREQUENCY_TO_STRIPE_INTERVAL[nextFrequency];
        if (!recurring) {
          return validationErrorResponse(new z.ZodError([{
            code: 'custom',
            path: ['frequency'],
            message: 'Unsupported subscription frequency',
          }]));
        }

        try {
          for (const item of subscription.items) {
            const discountedAmount = Math.max(
              0.01,
              Number(item.priceAtSubscription) * (1 - newDiscountPercent / 100)
            );

            const price = await stripe.prices.create({
              currency: 'usd',
              unit_amount: Math.round(discountedAmount * 100),
              recurring: {
                interval: recurring.interval,
                interval_count: recurring.intervalCount,
              },
              product_data: {
                name: buildSubscriptionItemTitle(item),
                metadata: {
                  userId,
                  subscriptionId: subscription.id,
                  subscriptionItemId: item.id,
                },
              },
              metadata: {
                userId,
                subscriptionId: subscription.id,
                subscriptionItemId: item.id,
              },
            });

            createdStripePriceIds.push(price.id);
            newStripePriceByItemId.set(item.id, price.id);
          }

          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripeSubscriptionId,
            {
              expand: ['items.data.price'],
            }
          );

          const stripeItemIdBySubscriptionItemId = new Map<string, string>();
          for (const stripeItem of stripeSubscription.items.data) {
            const stripePrice = stripeItem.price as Stripe.Price;
            const localSubscriptionItemId = stripePrice.metadata?.subscriptionItemId;
            if (localSubscriptionItemId) {
              stripeItemIdBySubscriptionItemId.set(localSubscriptionItemId, stripeItem.id);
            }
          }

          const stripeItemsForUpdate = subscription.items.map((item) => {
            const stripeItemId = stripeItemIdBySubscriptionItemId.get(item.id);
            const newStripePriceId = newStripePriceByItemId.get(item.id);

            if (!stripeItemId || !newStripePriceId) {
              throw new Error(`Unable to map Stripe subscription item for ${item.id}`);
            }

            return {
              id: stripeItemId,
              price: newStripePriceId,
              quantity: item.quantity,
            };
          });

          const updatedStripeSubscription = await stripe.subscriptions.update(
            subscription.stripeSubscriptionId,
            {
              items: stripeItemsForUpdate,
              proration_behavior: 'none',
              metadata: {
                userId,
                subscriptionId: subscription.id,
                frequency: nextFrequency,
              },
            }
          );

          stripeStatusToPersist = updatedStripeSubscription.status;
        } catch (stripeError) {
          await archiveStripePrices(createdStripePriceIds);
          throw stripeError;
        }
      }
    }

    // Handle status change (pause/resume)
    if (needsStatusUpdate) {
      updateData.status = status;

      if (subscription.stripeSubscriptionId) {
        if (status === 'PAUSED' && subscription.status !== 'PAUSED') {
          const updatedStripeSubscription = await stripe.subscriptions.update(
            subscription.stripeSubscriptionId,
            {
              pause_collection: {
                behavior: 'void',
              },
            }
          );
          stripeStatusToPersist = updatedStripeSubscription.status;
        } else if (status === 'ACTIVE' && subscription.status === 'PAUSED') {
          const updatedStripeSubscription = await stripe.subscriptions.update(
            subscription.stripeSubscriptionId,
            {
              pause_collection: null,
            }
          );
          stripeStatusToPersist = updatedStripeSubscription.status;
        }
      }

      // If resuming, recalculate next delivery date from today
      if (status === 'ACTIVE' && subscription.status === 'PAUSED') {
        const currentFrequency = (frequency || subscription.frequency) as SubscriptionFrequency;
        updateData.nextDeliveryDate = calculateNextDeliveryDate(currentFrequency);
        updateData.pausedAt = null;
      }

      if (status === 'PAUSED') {
        updateData.pausedAt = new Date();
      }
    }

    if (stripeStatusToPersist) {
      updateData.stripeStatus = stripeStatusToPersist;
    }

    // Update the subscription
    const updatedSubscription = await prisma.$transaction(async (tx) => {
      if (newDiscountPercent !== null) {
        for (const item of subscription.items) {
          await tx.subscriptionItem.update({
            where: { id: item.id },
            data: {
              discountPercent: newDiscountPercent,
              stripePriceId: newStripePriceByItemId.get(item.id) || item.stripePriceId,
            },
          });
        }
      }

      return tx.subscription.update({
        where: { id },
        data: updateData,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  image: true,
                  price: true,
                  salePrice: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  sku: true,
                  size: true,
                  color: true,
                  colorCode: true,
                  material: true,
                  price: true,
                  salePrice: true,
                  image: true,
                },
              },
            },
          },
        },
      });
    });

    if (needsFrequencyUpdate) {
      // Archive stale Stripe prices after successful swap.
      await archiveStripePrices(oldStripePriceIds);
    }

    return successResponse(updatedSubscription);
  } catch (error) {
    logger.error('Failed to update subscription', error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/subscriptions/[id]
 * Cancel a subscription (soft delete - sets status to CANCELLED)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting (standard: 10 req/10s)
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(`subscription-delete:${identifier}`);
    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    // CSRF protection
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    const { userId } = await getServerAuth();
    const { id } = await params;

    if (!userId) {
      return unauthorizedResponse('Please sign in to cancel your subscription');
    }

    // Find the subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return notFoundResponse('Subscription');
    }

    // Verify ownership
    if (subscription.userId !== userId) {
      return forbiddenResponse('You do not have access to this subscription');
    }

    // Check if already cancelled
    if (subscription.status === 'CANCELLED') {
      return forbiddenResponse('Subscription is already cancelled');
    }

    let stripeStatus: string | null = null;
    if (subscription.stripeSubscriptionId) {
      const stripeSubscription = await getStripe().subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      );
      stripeStatus = stripeSubscription.status;
    }

    // Soft delete - set status to CANCELLED
    const cancelledSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        stripeStatus: stripeStatus || subscription.stripeStatus,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return successResponse(cancelledSubscription);
  } catch (error) {
    logger.error('Failed to cancel subscription', error);
    return handleApiError(error);
  }
}
