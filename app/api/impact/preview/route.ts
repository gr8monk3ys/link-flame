/**
 * POST /api/impact/preview
 *
 * Returns estimated environmental impact for a set of cart items.
 * This is used to show impact preview in the cart before checkout.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getCartImpactPreview } from "@/lib/impact";
import {
  successResponse,
  validationErrorResponse,
  handleApiError,
  rateLimitErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
});

const requestSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to prevent abuse
    const identifier = getIdentifier(request);
    const { success, reset } = await checkRateLimit(identifier);

    if (!success) {
      return rateLimitErrorResponse(reset);
    }

    const body = await request.json();

    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { items } = validation.data;

    const impactPreview = await getCartImpactPreview(items);

    logger.info("Cart impact preview calculated", {
      itemCount: items.length,
      metricsCount: impactPreview.length,
    });

    return successResponse(impactPreview);
  } catch (error) {
    logger.error("Failed to calculate cart impact preview", error);
    return handleApiError(error);
  }
}
