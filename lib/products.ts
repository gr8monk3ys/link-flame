import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image: string;
  reviews: { rating: number }[];
}

interface Category {
  id: string;
  name: string;
}

export async function getProduct(id: string): Promise<Product> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  return product;
}

export async function getProductCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany();
    return categories;
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return [];
  }
}

export async function getPriceRanges(): Promise<{ min: number; max: number }[]> {
  return [
    { min: 0, max: 25 },
    { min: 25, max: 50 },
    { min: 50, max: 100 },
    { min: 100, max: 200 },
    { min: 200, max: 500 },
  ];
}
