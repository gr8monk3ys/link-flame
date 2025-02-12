import { NextResponse } from 'next/server';
import { getProductCategories } from '@/lib/products';

export async function GET() {
  try {
    const categories = await getProductCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
