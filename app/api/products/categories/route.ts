import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-response';

interface Category {
  id: string;
  name: string;
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return handleApiError(error);
  }
}
