import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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
    return new NextResponse("Internal error", { status: 500 });
  }
}
