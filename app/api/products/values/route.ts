import { NextRequest } from "next/server";
import {
  handleApiError,
  rateLimitErrorResponse,
  successResponse
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { getProductValues } from "@/lib/products/values";
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
    return successResponse(await getProductValues());
  } catch (error) {
    logger.error('Failed to fetch product values', error);
    return handleApiError(error);
  }
}
