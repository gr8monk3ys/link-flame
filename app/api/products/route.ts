import { NextRequest } from "next/server"
import { getServerAuth, requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import {
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
  errorResponse,
  successResponse,
  paginatedResponse,
} from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { invalidateProductCaches } from "@/lib/cache"
import { checkRateLimit, getIdentifier } from "@/lib/rate-limit"
import { validateCsrfToken } from "@/lib/csrf"
import { calculatePaginationMeta } from "@/lib/api/pagination"

// Schema for product filtering
const filterSchema = z.object({
  categories: z.array(z.string()).optional(),
  priceRange: z
    .object({
      min: z.number().nonnegative("Minimum price must be non-negative").max(1000000, "Minimum price cannot exceed $1,000,000"),
      max: z.number().positive("Maximum price must be positive").max(1000000, "Maximum price cannot exceed $1,000,000"),
    })
    .refine((data) => data.min < data.max, {
      message: "Minimum price must be less than maximum price",
    })
    .optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'rating']).optional(),
  page: z.number().int().min(1).max(10000).default(1),
  pageSize: z.number().int().min(1).max(100).default(12),
  searchQuery: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  dateRange: z
    .object({
      start: z.string().nullable(),
      end: z.string().nullable(),
    })
    .optional(),
})

// Schema for product creation
const createProductSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(2000, "Description is too long").optional(),
  price: z.number().positive("Price must be positive").max(1000000, "Price cannot exceed $1,000,000"),
  salePrice: z.number().positive("Sale price must be positive").max(1000000, "Sale price cannot exceed $1,000,000").optional(),
  image: z.string().url("Image must be a valid URL"),
  category: z.string().max(100, "Category name is too long").optional().default("Uncategorized"),
})
.refine((data) => !data.salePrice || data.salePrice < data.price, {
  message: "Sale price must be less than regular price",
  path: ["salePrice"],
})

export async function GET(request: NextRequest) {
  // Rate limit to prevent catalog scraping
  const identifier = getIdentifier(request);
  const { success, reset } = await checkRateLimit(`products:${identifier}`);
  if (!success) {
    return rateLimitErrorResponse(reset);
  }

  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const search = searchParams.get('search');
    const categories = searchParams.getAll('category');
    const rating = searchParams.get('rating') ? Number(searchParams.get('rating')) : null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null;
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 12;
    // Imperfect products filter
    const imperfect = searchParams.get('imperfect');
    // "Shop by Values" filter - comma-separated value slugs
    const valuesParam = searchParams.get('values');
    const valueSlugs = valuesParam ? valuesParam.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Build where clause with proper Prisma types
    const where: Prisma.ProductWhereInput = {};

    if (search) {
      // Note: SQLite doesn't support case-insensitive mode, using contains only
      // For production PostgreSQL, add mode: 'insensitive' to each filter
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ];
    }

    if (categories.length > 0) {
      where.category = { in: categories };
    }

    if (startDate || endDate) {
      const createdAtFilter: Prisma.DateTimeFilter = {};
      if (startDate) createdAtFilter.gte = new Date(startDate);
      if (endDate) createdAtFilter.lte = new Date(endDate);
      where.createdAt = createdAtFilter;
    }

    if (minPrice !== null || maxPrice !== null) {
      const priceFilter: Prisma.DecimalFilter = {};
      if (minPrice !== null) priceFilter.gte = minPrice;
      if (maxPrice !== null) priceFilter.lte = maxPrice;
      where.price = priceFilter;
    }

    // Filter by imperfect status
    if (imperfect === 'true') {
      where.isImperfect = true;
    } else if (imperfect === 'false') {
      where.isImperfect = false;
    }

    // Filter by sustainability values (Shop by Values)
    // Shows products matching ANY of the selected values (OR logic)
    if (valueSlugs.length > 0) {
      where.values = {
        some: {
          value: {
            slug: { in: valueSlugs },
          },
        },
      };
    }

    // Pre-filter by rating using Prisma groupBy to fix pagination count mismatch
    if (rating) {
      const ratingGroups = await prisma.review.groupBy({
        by: ['productId'],
        _avg: { rating: true },
        having: { rating: { _avg: { gte: rating } } },
      })
      const qualifiedProductIds = ratingGroups.map(g => g.productId)
      where.id = { in: qualifiedProductIds }
    }

    // Use transaction to execute count and findMany in parallel for better performance
    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          reviews: {
            select: {
              rating: true,
            },
          },
          // Include product values for "Shop by Values" badges
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
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Normalize prices and calculate imperfect discounted prices
    const normalizedProducts = products.map((product) => {
      const basePrice = Number(product.price);
      const salePrice = product.salePrice ? Number(product.salePrice) : null;

      // Calculate imperfect price if product is imperfect with a discount
      let imperfectPrice = null;
      if (product.isImperfect && product.imperfectDiscount) {
        const effectivePrice = salePrice ?? basePrice;
        imperfectPrice = effectivePrice * (1 - product.imperfectDiscount / 100);
      }

      // Flatten values for easier frontend consumption
      const values = product.values?.map((pva) => pva.value) || [];

      return {
        ...product,
        price: basePrice,
        salePrice,
        imperfectPrice,
        values, // Array of { id, name, slug, iconName }
      };
    });

    // Use standardized paginated response format
    const pagination = calculatePaginationMeta(total, page, pageSize)

    return paginatedResponse(normalizedProducts, pagination)
  } catch (error) {
    logger.error('Failed to fetch products', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // CSRF protection for admin product creation
    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return errorResponse(
        "Invalid or missing CSRF token",
        "CSRF_VALIDATION_FAILED",
        undefined,
        403
      );
    }

    const { userId } = await getServerAuth()

    // Check if user is authenticated
    if (!userId) {
      return unauthorizedResponse("Please sign in to create products")
    }

    // Check if user has required role (ADMIN or EDITOR)
    const hasPermission = await requireRole(userId, ['ADMIN', 'EDITOR'])
    if (!hasPermission) {
      return forbiddenResponse("Only admins and editors can create products")
    }

    const body = await request.json();

    // Validate input
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const { title, description, price, salePrice, image, category } = validation.data;

    const product = await prisma.product.create({
      data: {
        title,
        description: description || null,
        price,
        salePrice: salePrice || null,
        image,
        category,
      },
    });

    // Invalidate product caches
    await invalidateProductCaches();

    return successResponse(product, undefined, 201)
  } catch (error) {
    logger.error('Failed to create product', error);
    return handleApiError(error);
  }
}
