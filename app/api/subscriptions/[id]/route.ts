import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerAuth } from '@/lib/auth';
import { validateCsrfToken } from '@/lib/csrf';
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
  isValidStatus,
  SubscriptionStatus,
} from '@/lib/subscriptions';

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
      include: { items: true },
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
      return forbiddenResponse('Cannot modify a cancelled subscription');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Handle frequency change
    if (frequency && isValidFrequency(frequency) && frequency !== subscription.frequency) {
      updateData.frequency = frequency;
      // Recalculate next delivery date with new frequency
      updateData.nextDeliveryDate = calculateNextDeliveryDate(
        frequency,
        subscription.lastDeliveryDate || new Date()
      );

      // Update discount percentage on all items
      const newDiscountPercent = getDiscountForFrequency(frequency);
      await prisma.subscriptionItem.updateMany({
        where: { subscriptionId: id },
        data: { discountPercent: newDiscountPercent },
      });
    }

    // Handle status change (pause/resume)
    if (status && isValidStatus(status) && status !== subscription.status) {
      updateData.status = status;

      // If resuming, recalculate next delivery date from today
      if (status === 'ACTIVE' && subscription.status === 'PAUSED') {
        const currentFrequency = (frequency || subscription.frequency) as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY';
        updateData.nextDeliveryDate = calculateNextDeliveryDate(currentFrequency);
      }
    }

    // Update the subscription
    const updatedSubscription = await prisma.subscription.update({
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

    return successResponse(updatedSubscription);
  } catch (error) {
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

    // Soft delete - set status to CANCELLED
    const cancelledSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED',
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
    return handleApiError(error);
  }
}
