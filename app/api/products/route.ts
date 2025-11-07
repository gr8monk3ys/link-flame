import { NextRequest, NextResponse } from "next/server"
import { getServerAuth, requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import {
  handleApiError,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse
} from "@/lib/api-response"
import { logger } from "@/lib/logger"

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

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categories.length > 0) {
      where.category = { in: categories };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (minPrice !== null || maxPrice !== null) {
      where.price = {};
      if (minPrice !== null) where.price.gte = minPrice;
      if (maxPrice !== null) where.price.lte = maxPrice;
    }

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Filter by rating after fetching (since we need to calculate average)
    const filteredProducts = rating
      ? products.filter((product) => {
          const avgRating =
            product.reviews.reduce((sum, review) => sum + review.rating, 0) /
            product.reviews.length;
          return avgRating >= rating;
        })
      : products;

    return NextResponse.json({
      products: filteredProducts,
      total: total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    logger.error('Failed to fetch products', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json(product);
  } catch (error) {
    logger.error('Failed to create product', error);
    return handleApiError(error);
  }
}
