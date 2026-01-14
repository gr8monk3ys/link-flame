import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, errorResponse, notFoundResponse, rateLimitErrorResponse } from '@/lib/api-response';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

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
    const product = await prisma.product.findUnique({
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
      },
    });

    if (!product) {
      return notFoundResponse("Product");
    }

    // Normalize prices to ensure they're plain numbers
    const normalizedProduct = {
      ...product,
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      variants: product.variants.map((variant) => ({
        ...variant,
        price: variant.price ? Number(variant.price) : null,
        salePrice: variant.salePrice ? Number(variant.salePrice) : null,
      })),
    };

    return NextResponse.json(normalizedProduct);
  } catch (error) {
    logger.error('Failed to fetch product', error);
    return handleApiError(error);
  }
}
