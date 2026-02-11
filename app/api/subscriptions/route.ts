import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerAuth } from '@/lib/auth';
import { validateCsrfToken } from '@/lib/csrf';
import {
  successResponse,
  paginatedResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
  handleApiError,
  rateLimitErrorResponse,
} from '@/lib/api-response';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import {
  generateVisibleId,
  calculateNextDeliveryDate,
  getDiscountForFrequency,
  isValidFrequency,
} from '@/lib/subscriptions';

export const dynamic = 'force-dynamic'

// Pagination query parameter validation schema
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

// Validation schemas
const createSubscriptionSchema = z.object({
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY']),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantId: z.string().optional().nullable(),
    quantity: z.number().int().min(1).max(99).default(1),
  })).min(1, 'At least one item is required'),
});

/**
 * GET /api/subscriptions
 * List paginated subscriptions for the authenticated user
 *
 * Query Parameters:
 * - page: number (optional, default: 1) - Page number
 * - limit: number (optional, default: 10, max: 50) - Items per page
 * - status: string (optional) - Filter by status (ACTIVE, PAUSED, CANCELLED)
 *
 * Response: 200 OK
 * {
 *   "success": true,
 *   "data": [...subscriptions],
 *   "meta": {
 *     "timestamp": "...",
 *     "pagination": {
 *       "page": 1,
 *       "limit": 10,
 *       "total": 25,
 *       "totalPages": 3,
 *       "hasNextPage": true,
 *       "hasPreviousPage": false
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting (standard: 10 req/10s)
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(`subscriptions-list:${identifier}`);
    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const { userId } = await getServerAuth();

    if (!userId) {
      return unauthorizedResponse('Please sign in to view your subscriptions');
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filter by status

    // Parse and validate pagination parameters
    const paginationParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    };

    const paginationValidation = paginationSchema.safeParse(paginationParams);
    if (!paginationValidation.success) {
      return validationErrorResponse(paginationValidation.error);
    }

    const { page, limit } = paginationValidation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { userId };
    if (status && ['ACTIVE', 'PAUSED', 'CANCELLED'].includes(status)) {
      where.status = status;
    }

    // Get total count for pagination metadata
    const total = await prisma.subscription.count({ where });

    // Fetch paginated subscriptions with items and product details
    const subscriptions = await prisma.subscription.findMany({
      where,
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return paginatedResponse(subscriptions, {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/subscriptions
 * Create a new subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (standard: 10 req/10s)
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(`subscriptions-create:${identifier}`);
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

    if (!userId) {
      return unauthorizedResponse('Please sign in to create a subscription');
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { frequency, items } = validation.data;

    // Validate that frequency is valid
    if (!isValidFrequency(frequency)) {
      return validationErrorResponse(new z.ZodError([{
        code: 'custom',
        path: ['frequency'],
        message: 'Invalid frequency',
      }]));
    }

    // Fetch all products to verify they exist and are subscribable
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        variants: true,
      },
    });

    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate each item
    const subscriptionItems: Array<{
      productId: string;
      variantId: string | null;
      quantity: number;
      priceAtSubscription: number;
      discountPercent: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        return notFoundResponse(`Product ${item.productId}`);
      }

      if (!product.isSubscribable) {
        return validationErrorResponse(new z.ZodError([{
          code: 'custom',
          path: ['items'],
          message: `Product "${product.title}" is not available for subscription`,
        }]));
      }

      // If variant is specified, validate it exists
      let price = Number(product.salePrice ?? product.price);
      if (item.variantId) {
        const variant = product.variants.find(v => v.id === item.variantId);
        if (!variant) {
          return notFoundResponse(`Variant ${item.variantId} for product ${product.title}`);
        }
        // Use variant price if available
        price = Number(variant.salePrice ?? variant.price ?? price);
      }

      subscriptionItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        priceAtSubscription: price,
        discountPercent: getDiscountForFrequency(frequency),
      });
    }

    // Generate a unique visible ID
    let visibleId = generateVisibleId();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.subscription.findUnique({
        where: { visibleId },
      });
      if (!existing) break;
      visibleId = generateVisibleId();
      attempts++;
    }

    // Calculate next delivery date
    const nextDeliveryDate = calculateNextDeliveryDate(frequency);

    // Create the subscription with items
    const subscription = await prisma.subscription.create({
      data: {
        visibleId,
        userId,
        status: 'ACTIVE',
        frequency,
        nextDeliveryDate,
        items: {
          create: subscriptionItems,
        },
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

    return successResponse(subscription, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
