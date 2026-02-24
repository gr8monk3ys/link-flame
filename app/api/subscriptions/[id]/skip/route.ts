import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuth } from '@/lib/auth';
import { validateCsrfToken } from '@/lib/csrf';
import { getStripe } from '@/lib/stripe-server';
import { logger } from '@/lib/logger';
import {
  successResponse,
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
  SubscriptionFrequency,
} from '@/lib/subscriptions';

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/subscriptions/[id]/skip
 * Skip the next delivery for a subscription
 * Moves the next delivery date forward by one frequency period
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(`subscription-skip:${identifier}`);
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
      return unauthorizedResponse('Please sign in to skip a delivery');
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

    // Can only skip active subscriptions
    if (subscription.status !== 'ACTIVE') {
      return forbiddenResponse(`Cannot skip delivery for a ${subscription.status.toLowerCase()} subscription`);
    }

    let newNextDeliveryDate = calculateNextDeliveryDate(
      subscription.frequency as SubscriptionFrequency,
      subscription.nextDeliveryDate
    );
    let stripeStatus = subscription.stripeStatus;

    if (subscription.stripeSubscriptionId) {
      const stripeSubscription = await getStripe().subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );
      const currentPeriodEnd = stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : subscription.nextDeliveryDate;

      // Skip one cycle by pausing collection until one period past current period end.
      newNextDeliveryDate = calculateNextDeliveryDate(
        subscription.frequency as SubscriptionFrequency,
        currentPeriodEnd
      );

      const resumedAtTimestamp = Math.floor(newNextDeliveryDate.getTime() / 1000);
      const pausedSubscription = await getStripe().subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          pause_collection: {
            behavior: 'void',
            resumes_at: resumedAtTimestamp,
          },
        }
      );
      stripeStatus = pausedSubscription.status;
    }

    // Update the subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        nextDeliveryDate: newNextDeliveryDate,
        skipNextDelivery: false, // Reset skip flag after skipping
        stripeStatus,
      },
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

    return successResponse({
      ...updatedSubscription,
      message: `Next delivery skipped. New delivery date: ${newNextDeliveryDate.toLocaleDateString()}`,
    });
  } catch (error) {
    logger.error('Failed to skip subscription delivery', error);
    return handleApiError(error);
  }
}
