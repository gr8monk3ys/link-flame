import { NextResponse } from 'next/server';
import { getPriceRanges } from '@/lib/products';

export async function GET() {
  try {
    const priceRanges = await getPriceRanges();
    return NextResponse.json(priceRanges);
  } catch (error) {
    console.error('Error fetching price ranges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price ranges' },
      { status: 500 }
    );
  }
}
