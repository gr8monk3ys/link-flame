import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Schema for product filtering
const filterSchema = z.object({
  categories: z.array(z.string()).optional(),
  priceRange: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'rating']).optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(48).default(12),
  searchQuery: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  dateRange: z
    .object({
      start: z.string().nullable(),
      end: z.string().nullable(),
    })
    .optional(),
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
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and has admin/editor role
    if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json();

    const product = await prisma.product.create({
      data: {
        title: body.title,
        description: body.description,
        price: body.price,
        salePrice: body.salePrice,
        image: body.image,
        category: body.category,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
