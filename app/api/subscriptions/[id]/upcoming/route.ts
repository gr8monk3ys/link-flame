import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerAuth } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  handleApiError,
  rateLimitErrorResponse,
} from '@/lib/api-response';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import {
  calculateSubscriptionTotal,
  FREQUENCY_LABELS,
  SubscriptionFrequency,
} from '@/lib/subscriptions';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/subscriptions/[id]/upcoming
 * Preview the next order for a subscription
 * Shows what items will be delivered, prices, and discounts
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await getServerAuth();
    const { id } = await params;

    if (!userId) {
      return unauthorizedResponse('Please sign in to view upcoming deliveries');
    }

    // Find the subscription with all details
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
                inventory: true,
                isSubscribable: true,
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

    // Check if subscription is active
    if (subscription.status !== 'ACTIVE') {
      return forbiddenResponse(`Cannot preview upcoming order for a ${subscription.status.toLowerCase()} subscription`);
    }

    // Build the upcoming order preview
    const orderItems = subscription.items.map(item => {
      // Use current product price for comparison
      const currentPrice = item.variant
        ? (item.variant.salePrice ?? item.variant.price ?? item.product.salePrice ?? item.product.price)
        : (item.product.salePrice ?? item.product.price);

      const subscriptionPrice = item.priceAtSubscription;
      const discountedPrice = subscriptionPrice * (1 - item.discountPercent / 100);
      const itemTotal = discountedPrice * item.quantity;

      // Check inventory
      const inventory = item.variant?.inventory ?? item.product.inventory;
      const inStock = inventory >= item.quantity;

      return {
        id: item.id,
        product: {
          id: item.product.id,
          title: item.product.title,
          description: item.product.description,
          image: item.variant?.image ?? item.product.image,
        },
        variant: item.variant ? {
          id: item.variant.id,
          sku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color,
          colorCode: item.variant.colorCode,
          material: item.variant.material,
        } : null,
        quantity: item.quantity,
        pricing: {
          currentPrice: Math.round(currentPrice * 100) / 100,
          subscriptionPrice: Math.round(subscriptionPrice * 100) / 100,
          discountPercent: item.discountPercent,
          discountedPrice: Math.round(discountedPrice * 100) / 100,
          itemTotal: Math.round(itemTotal * 100) / 100,
        },
        inStock,
        availableInventory: inventory,
      };
    });

    // Calculate totals
    const totals = calculateSubscriptionTotal(subscription.items);

    // Check if all items are in stock
    const allInStock = orderItems.every(item => item.inStock);
    const outOfStockItems = orderItems.filter(item => !item.inStock);

    // Build the response
    const upcomingOrder = {
      subscription: {
        id: subscription.id,
        visibleId: subscription.visibleId,
        status: subscription.status,
        frequency: subscription.frequency,
        frequencyLabel: FREQUENCY_LABELS[subscription.frequency as SubscriptionFrequency],
        nextDeliveryDate: subscription.nextDeliveryDate,
        skipNextDelivery: subscription.skipNextDelivery,
      },
      items: orderItems,
      summary: {
        itemCount: orderItems.length,
        totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        total: totals.total,
        allInStock,
        outOfStockItems: outOfStockItems.map(item => ({
          productId: item.product.id,
          title: item.product.title,
          variantId: item.variant?.id,
        })),
      },
      deliveryInfo: {
        scheduledDate: subscription.nextDeliveryDate,
        canSkip: subscription.status === 'ACTIVE' && !subscription.skipNextDelivery,
      },
    };

    return successResponse(upcomingOrder);
  } catch (error) {
    return handleApiError(error);
  }
}
