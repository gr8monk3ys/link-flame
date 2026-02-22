import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  handleApiError,
  errorResponse,
  notFoundResponse,
  rateLimitErrorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
} from '@/lib/api-response';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { withPrismaRetry } from '@/lib/prisma-retry';
import { getServerAuth, requireRole } from '@/lib/auth';
import { validateCsrfToken } from '@/lib/csrf';
import { invalidateProductCaches } from '@/lib/cache';
import { z } from 'zod';

export const dynamic = 'force-dynamic'

// Using a simpler approach with request URL
export async function GET(request: NextRequest) {
  // Extract the ID from the URL path
  const pathname = request.nextUrl.pathname;
  const id = pathname.split('/').pop();

  if (!id) {
    return errorResponse("Product ID is required", undefined, undefined, 400);
  }

  // Rate limit to prevent enumeration attacks
  const identifier = getIdentifier(request);
  const { success, reset } = await checkRateLimit(`product:${identifier}`);
  if (!success) {
    return rateLimitErrorResponse(reset);
  }

  try {
    const product = await withPrismaRetry(async () =>
      prisma.product.findUnique({
        where: { id },
        include: {
          reviews: {
            select: {
              rating: true,
            },
          },
          variants: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
          // Include product values for "Shop by Values" display
          values: {
            include: {
              value: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  iconName: true,
                },
              },
            },
          },
        },
      })
    );

    if (!product) {
      return notFoundResponse("Product");
    }

    // Normalize prices and flatten values
    const normalizedProduct = {
      ...product,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      variants: product.variants.map((variant) => ({
        ...variant,
        price: variant.price ? Number(variant.price) : null,
        salePrice: variant.salePrice ? Number(variant.salePrice) : null,
      })),
      // Flatten values for easier frontend consumption
      values: product.values?.map((pva) => pva.value) || [],
    };

    return successResponse(normalizedProduct)
  } catch (error) {
    logger.error('Failed to fetch product', error);
    return handleApiError(error);
  }
}

// Schema for product updates (all fields optional)
const updateProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  subtitle: z.string().max(200, 'Subtitle is too long').nullable().optional(),
  description: z.string().max(2000, 'Description is too long').nullable().optional(),
  price: z.number().positive('Price must be positive').max(1000000, 'Price cannot exceed $1,000,000').optional(),
  salePrice: z.number().positive('Sale price must be positive').max(1000000, 'Sale price cannot exceed $1,000,000').nullable().optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  category: z.string().max(100, 'Category name is too long').optional(),
  inventory: z.number().int('Inventory must be a whole number').min(0, 'Inventory cannot be negative').optional(),
  isImperfect: z.boolean().optional(),
  imperfectDiscount: z.number().int().min(1).max(90).nullable().optional(),
  isSubscribable: z.boolean().optional(),
}).refine((data) => {
  if (data.salePrice !== undefined && data.salePrice !== null && data.price !== undefined) {
    return data.salePrice < data.price
  }
  return true
}, {
  message: 'Sale price must be less than regular price',
  path: ['salePrice'],
})

export async function PATCH(request: NextRequest) {
  // Extract the ID from the URL path
  const pathname = request.nextUrl.pathname
  const segments = pathname.split('/')
  // Path is /api/products/[id], so id is the last segment
  const id = segments[segments.length - 1]

  if (!id) {
    return errorResponse('Product ID is required', undefined, undefined, 400)
  }

  try {
    // CSRF protection for product updates
    const csrfValid = await validateCsrfToken(request)
    if (!csrfValid) {
      return errorResponse(
        'Invalid or missing CSRF token',
        'CSRF_VALIDATION_FAILED',
        undefined,
        403
      )
    }

    const { userId } = await getServerAuth()

    if (!userId) {
      return unauthorizedResponse('Please sign in to update products')
    }

    const hasPermission = await requireRole(userId, ['ADMIN', 'EDITOR'])
    if (!hasPermission) {
      return forbiddenResponse('Only admins and editors can update products')
    }

    const body = await request.json()

    // Validate input
    const validation = updateProductSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    // Check that the product exists before updating
    const existing = await withPrismaRetry(async () =>
      prisma.product.findUnique({ where: { id } })
    )

    if (!existing) {
      return notFoundResponse('Product')
    }

    // If salePrice is provided without price, validate against existing price
    if (
      validation.data.salePrice !== undefined &&
      validation.data.salePrice !== null &&
      validation.data.price === undefined
    ) {
      if (validation.data.salePrice >= Number(existing.price)) {
        return errorResponse(
          'Sale price must be less than regular price',
          'VALIDATION_ERROR',
          undefined,
          400
        )
      }
    }

    const product = await withPrismaRetry(async () =>
      prisma.product.update({
        where: { id },
        data: validation.data,
      })
    )

    // Invalidate product caches
    await invalidateProductCaches(id)

    // Normalize prices in response
    const normalizedProduct = {
      ...product,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
    }

    return successResponse(normalizedProduct)
  } catch (error) {
    logger.error('Failed to update product', error)
    return handleApiError(error)
  }
}
