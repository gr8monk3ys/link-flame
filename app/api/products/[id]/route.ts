import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, errorResponse, notFoundResponse } from '@/lib/api-response';

// Using a simpler approach with request URL
export async function GET(request: NextRequest) {
  // Extract the ID from the URL path
  const pathname = request.nextUrl.pathname;
  const id = pathname.split('/').pop();

  if (!id) {
    return errorResponse("Product ID is required", undefined, undefined, 400);
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

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return handleApiError(error);
  }
}
