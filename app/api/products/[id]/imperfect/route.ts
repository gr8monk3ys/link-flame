import { NextRequest } from "next/server";
import { getServerAuth, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  errorResponse,
  successResponse,
} from "@/lib/api-response";
import { validateCsrfToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { invalidateProductCaches } from "@/lib/cache";
import { IMPERFECT_REASONS } from "../../imperfect/route";

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schema for marking a product as imperfect
const markImperfectSchema = z.object({
  isImperfect: z.boolean(),
  imperfectReason: z.string().max(500, "Reason is too long").optional().nullable(),
  imperfectDiscount: z
    .number()
    .int()
    .min(1, "Discount must be at least 1%")
    .max(90, "Discount cannot exceed 90%")
    .optional()
    .nullable(),
});

// Schema for updating imperfect details
const updateImperfectSchema = z
  .object({
    imperfectReason: z.string().max(500, "Reason is too long").optional(),
    imperfectDiscount: z
      .number()
      .int()
      .min(1, "Discount must be at least 1%")
      .max(90, "Discount cannot exceed 90%")
      .optional(),
  })
  .refine(
    (data) => data.imperfectReason !== undefined || data.imperfectDiscount !== undefined,
    { message: "At least one field (imperfectReason or imperfectDiscount) must be provided" }
  );

/**
 * GET /api/products/[id]/imperfect
 * Get imperfect status and details for a specific product
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  if (!id) {
    return notFoundResponse("Product");
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        price: true,
        salePrice: true,
        isImperfect: true,
        imperfectReason: true,
        imperfectDiscount: true,
        imperfectBatches: {
          where: { isActive: true },
          select: {
            id: true,
            quantity: true,
            reason: true,
            discountPercent: true,
            expiresAt: true,
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            isImperfect: true,
            imperfectReason: true,
            imperfectDiscount: true,
          },
        },
      },
    });

    if (!product) {
      return notFoundResponse("Product");
    }

    // Calculate imperfect pricing
    const basePrice = Number(product.price);
    const salePrice = product.salePrice ? Number(product.salePrice) : null;
    const effectivePrice = salePrice ?? basePrice;
    const discountPercent = product.imperfectDiscount ?? 0;
    const imperfectPrice = product.isImperfect && discountPercent > 0
      ? effectivePrice * (1 - discountPercent / 100)
      : null;

    // Find matching reason details
    const reasonDetails = product.imperfectReason
      ? IMPERFECT_REASONS.find(
          (r) =>
            product.imperfectReason?.toLowerCase().includes(r.id.replace("_", " ")) ||
            r.label.toLowerCase() === product.imperfectReason?.toLowerCase()
        )
      : null;

    return successResponse({
      productId: product.id,
      title: product.title,
      isImperfect: product.isImperfect,
      imperfectReason: product.imperfectReason,
      imperfectReasonLabel: reasonDetails?.label || product.imperfectReason,
      imperfectReasonDescription: reasonDetails?.description || null,
      imperfectDiscount: product.imperfectDiscount,
      pricing: {
        originalPrice: basePrice,
        salePrice,
        imperfectPrice: imperfectPrice ? Math.round(imperfectPrice * 100) / 100 : null,
        savings: imperfectPrice ? Math.round((effectivePrice - imperfectPrice) * 100) / 100 : null,
      },
      batches: product.imperfectBatches,
      variants: product.variants.filter((v) => v.isImperfect),
      availableReasons: IMPERFECT_REASONS,
    });
  } catch (error) {
    logger.error("Failed to fetch product imperfect status", error);
    return handleApiError(error);
  }
}

/**
 * PATCH /api/products/[id]/imperfect
 * Admin: Mark a product as imperfect or update imperfect details
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // CSRF protection for admin imperfect product management
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    const { id } = await params;

    if (!id) {
      return notFoundResponse("Product");
    }

    const { userId } = await getServerAuth();

    // Check if user is authenticated
    if (!userId) {
      return unauthorizedResponse("Please sign in to manage imperfect products");
    }

    // Check if user has required role (ADMIN or EDITOR)
    const hasPermission = await requireRole(userId, ["ADMIN", "EDITOR"]);
    if (!hasPermission) {
      return forbiddenResponse("Only admins and editors can manage imperfect products");
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, isImperfect: true },
    });

    if (!existingProduct) {
      return notFoundResponse("Product");
    }

    const body = await request.json();

    // Determine which schema to use based on request body
    if ("isImperfect" in body) {
      // Full update (mark as imperfect or remove imperfect status)
      const validation = markImperfectSchema.safeParse(body);
      if (!validation.success) {
        return validationErrorResponse(validation.error);
      }

      const { isImperfect, imperfectReason, imperfectDiscount } = validation.data;

      // If marking as imperfect, ensure discount is provided
      if (isImperfect && !imperfectDiscount && imperfectDiscount !== 0) {
        return errorResponse(
          "Discount is required when marking product as imperfect",
          "VALIDATION_ERROR",
          { field: "imperfectDiscount" },
          400
        );
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          isImperfect,
          imperfectReason: isImperfect ? imperfectReason : null,
          imperfectDiscount: isImperfect ? imperfectDiscount : null,
        },
        select: {
          id: true,
          title: true,
          isImperfect: true,
          imperfectReason: true,
          imperfectDiscount: true,
        },
      });

      // Invalidate product caches
      await invalidateProductCaches();

      logger.info(`Product ${id} ${isImperfect ? "marked as" : "removed from"} imperfect by user ${userId}`);

      return successResponse({
        message: isImperfect
          ? "Product marked as imperfect successfully"
          : "Product imperfect status removed successfully",
        product,
      });
    } else {
      // Partial update (only update reason or discount)
      if (!existingProduct.isImperfect) {
        return forbiddenResponse("Cannot update imperfect details for a non-imperfect product. Mark it as imperfect first.");
      }

      const validation = updateImperfectSchema.safeParse(body);
      if (!validation.success) {
        return validationErrorResponse(validation.error);
      }

      const { imperfectReason, imperfectDiscount } = validation.data;

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(imperfectReason !== undefined && { imperfectReason }),
          ...(imperfectDiscount !== undefined && { imperfectDiscount }),
        },
        select: {
          id: true,
          title: true,
          isImperfect: true,
          imperfectReason: true,
          imperfectDiscount: true,
        },
      });

      // Invalidate product caches
      await invalidateProductCaches();

      logger.info(`Product ${id} imperfect details updated by user ${userId}`);

      return successResponse({
        message: "Product imperfect details updated successfully",
        product,
      });
    }
  } catch (error) {
    logger.error("Failed to update product imperfect status", error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/products/[id]/imperfect
 * Admin: Remove imperfect status from a product
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // CSRF protection for admin imperfect product removal
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    const { id } = await params;

    if (!id) {
      return notFoundResponse("Product");
    }

    const { userId } = await getServerAuth();

    // Check if user is authenticated
    if (!userId) {
      return unauthorizedResponse("Please sign in to manage imperfect products");
    }

    // Check if user has required role (ADMIN only for delete)
    const hasPermission = await requireRole(userId, ["ADMIN"]);
    if (!hasPermission) {
      return forbiddenResponse("Only admins can remove imperfect status");
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, isImperfect: true },
    });

    if (!existingProduct) {
      return notFoundResponse("Product");
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        isImperfect: false,
        imperfectReason: null,
        imperfectDiscount: null,
      },
      select: {
        id: true,
        title: true,
        isImperfect: true,
      },
    });

    // Invalidate product caches
    await invalidateProductCaches();

    logger.info(`Product ${id} imperfect status removed by user ${userId}`);

    return successResponse({
      message: "Product imperfect status removed successfully",
      product,
    });
  } catch (error) {
    logger.error("Failed to remove product imperfect status", error);
    return handleApiError(error);
  }
}
