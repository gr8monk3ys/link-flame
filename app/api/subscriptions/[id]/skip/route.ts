import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuth } from '@/lib/auth';
import { validateCsrfToken } from '@/lib/csrf';
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

    // Calculate new next delivery date (push forward by one period)
    const newNextDeliveryDate = calculateNextDeliveryDate(
      subscription.frequency as SubscriptionFrequency,
      subscription.nextDeliveryDate
    );

    // Update the subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        nextDeliveryDate: newNextDeliveryDate,
        skipNextDelivery: false, // Reset skip flag after skipping
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
    return handleApiError(error);
  }
}
