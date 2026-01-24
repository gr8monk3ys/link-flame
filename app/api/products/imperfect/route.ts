import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  handleApiError,
  rateLimitErrorResponse,
  validationErrorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit";

// Common imperfect reasons for reference
export const IMPERFECT_REASONS = [
  { id: "dented_packaging", label: "Slightly dented packaging", description: "The product packaging has minor cosmetic dents but the product inside is perfect" },
  { id: "label_error", label: "Label printing error", description: "Small printing imperfection on the label - product quality unaffected" },
  { id: "short_expiry", label: "Short expiry date", description: "Approaching best-by date - still fresh and safe to use" },
  { id: "cosmetic_imperfection", label: "Cosmetic imperfection", description: "Minor visual blemish that doesn't affect product performance" },
  { id: "previous_season", label: "Previous season packaging", description: "Older packaging design - same great product inside" },
  { id: "overstock", label: "Overstock clearance", description: "We ordered too many - your gain!" },
  { id: "sample_stock", label: "Sample/display stock", description: "Previously used as display or sample - like new condition" },
  { id: "minor_damage", label: "Minor outer box damage", description: "Shipping box has cosmetic damage - inner product is protected" },
] as const;

// Schema for imperfect products query
const imperfectQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  category: z.string().optional(),
  minDiscount: z.coerce.number().min(0).max(100).optional(),
  maxDiscount: z.coerce.number().min(0).max(100).optional(),
  reason: z.string().optional(),
  sortBy: z.enum(["discount_desc", "discount_asc", "price_asc", "price_desc", "newest"]).optional().default("discount_desc"),
});

/**
 * GET /api/products/imperfect
 * Dedicated endpoint for fetching imperfect/ugly products with detailed information
 * Includes savings calculations and imperfect reason details
 */
export async function GET(request: NextRequest) {
  // Rate limit to prevent catalog scraping
  const identifier = getIdentifier(request);
  const { success, reset } = await checkRateLimit(`products:${identifier}`);
  if (!success) {
    return rateLimitErrorResponse(reset);
  }

  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = {
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "12",
      category: searchParams.get("category") || undefined,
      minDiscount: searchParams.get("minDiscount") || undefined,
      maxDiscount: searchParams.get("maxDiscount") || undefined,
      reason: searchParams.get("reason") || undefined,
      sortBy: searchParams.get("sortBy") || "discount_desc",
    };

    const validation = imperfectQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { page, pageSize, category, minDiscount, maxDiscount, reason, sortBy } = validation.data;

    // Build where clause for imperfect products only
    const where: Prisma.ProductWhereInput = {
      isImperfect: true,
      imperfectDiscount: { not: null },
    };

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by discount range
    if (minDiscount !== undefined || maxDiscount !== undefined) {
      const discountFilter: Prisma.IntNullableFilter = {};
      if (minDiscount !== undefined) discountFilter.gte = minDiscount;
      if (maxDiscount !== undefined) discountFilter.lte = maxDiscount;
      where.imperfectDiscount = discountFilter;
    }

    // Filter by reason (partial match)
    if (reason) {
      where.imperfectReason = { contains: reason };
    }

    // Build order by clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (sortBy) {
      case "discount_desc":
        orderBy = { imperfectDiscount: "desc" };
        break;
      case "discount_asc":
        orderBy = { imperfectDiscount: "asc" };
        break;
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      default:
        orderBy = { imperfectDiscount: "desc" };
    }

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Get imperfect products with pagination
    const products = await prisma.product.findMany({
      where,
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
        variants: {
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
            isDefault: true,
            sortOrder: true,
            isImperfect: true,
            imperfectReason: true,
            imperfectDiscount: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Transform products with calculated savings and imperfect details
    const imperfectProducts = products.map((product) => {
      const basePrice = Number(product.price);
      const salePrice = product.salePrice ? Number(product.salePrice) : null;
      const effectiveBasePrice = salePrice ?? basePrice;
      const discountPercent = product.imperfectDiscount ?? 0;

      // Calculate imperfect price
      const imperfectPrice = effectiveBasePrice * (1 - discountPercent / 100);
      const totalSavings = effectiveBasePrice - imperfectPrice;

      // Find matching reason details
      const reasonDetails = IMPERFECT_REASONS.find(
        (r) => product.imperfectReason?.toLowerCase().includes(r.id.replace("_", " ")) ||
               r.label.toLowerCase() === product.imperfectReason?.toLowerCase()
      );

      // Calculate average rating
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : null;

      return {
        id: product.id,
        title: product.title,
        description: product.description,
        image: product.image,
        category: product.category,
        inventory: product.inventory,
        hasVariants: product.hasVariants,
        variants: product.variants,
        // Price information
        originalPrice: basePrice,
        salePrice,
        imperfectPrice: Math.round(imperfectPrice * 100) / 100,
        discountPercent,
        totalSavings: Math.round(totalSavings * 100) / 100,
        // Imperfect details
        imperfectReason: product.imperfectReason,
        imperfectReasonLabel: reasonDetails?.label || product.imperfectReason,
        imperfectReasonDescription: reasonDetails?.description || "This item has minor imperfections that don't affect its quality or performance.",
        // Reviews
        averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount: product.reviews.length,
        // Metadata
        featured: product.featured,
        createdAt: product.createdAt,
      };
    });

    // Calculate aggregate stats for the collection
    const stats = {
      totalItems: total,
      averageDiscount: products.length > 0
        ? Math.round(products.reduce((sum, p) => sum + (p.imperfectDiscount ?? 0), 0) / products.length)
        : 0,
      maxDiscount: products.length > 0
        ? Math.max(...products.map((p) => p.imperfectDiscount ?? 0))
        : 0,
      categories: [...new Set(products.map((p) => p.category))],
    };

    const totalPages = Math.ceil(total / pageSize);

    return paginatedResponse(imperfectProducts, {
      page,
      limit: pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    logger.error("Failed to fetch imperfect products", error);
    return handleApiError(error);
  }
}

