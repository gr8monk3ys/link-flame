import { NextResponse } from 'next/server';
import { getPriceRanges } from '@/lib/products';
import { handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const priceRanges = await getPriceRanges();
    return NextResponse.json(priceRanges);
  } catch (error) {
    console.error('Error fetching price ranges:', error);
    return handleApiError(error);
  }
}
