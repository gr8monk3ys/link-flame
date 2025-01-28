import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  handleApiError,
  rateLimitErrorResponse,
  successResponse
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";

export const dynamic = 'force-dynamic'

/**
 * GET /api/products/values
 * Returns all product values with their product counts
 * Used for "Shop by Values" filtering UI
 */
export async function GET(request: NextRequest) {
  // Rate limit to prevent abuse
  const identifier = getIdentifier(request);
  const { success, reset } = await checkRateLimit(`values:${identifier}`);
  if (!success) {
    return rateLimitErrorResponse(reset);
  }

  try {
    // Get all product values with their product counts
    const values = await prisma.productValue.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    // Transform the response to include productCount at the top level
    const formattedValues = values.map((value) => ({
      id: value.id,
      name: value.name,
      slug: value.slug,
      description: value.description,
      iconName: value.iconName,
      sortOrder: value.sortOrder,
      productCount: value._count.products,
    }));

    return successResponse(formattedValues);
  } catch (error) {
    logger.error('Failed to fetch product values', error);
    return handleApiError(error);
  }
}
