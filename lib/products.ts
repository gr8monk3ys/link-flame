import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type ProductFilter = {
  priceRange?: {
    min?: number;
    max?: number;
  };
  sortBy?: 'price_asc' | 'price_desc' | 'newest';
};

export async function getProducts(filters: ProductFilter = {}) {
  const whereConditions: Prisma.ProductWhereInput = {
    ...(filters.priceRange?.min !== undefined
      ? { price: { gte: filters.priceRange.min } }
      : {}),
    ...(filters.priceRange?.max !== undefined
      ? { price: { lte: filters.priceRange.max } }
      : {}),
  };

  const products = await prisma.product.findMany({
    where: whereConditions,
    include: {
      reviews: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return products;
}

export async function getProductCategories() {
  const categories = await prisma.product.groupBy({
    by: ['id'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    label: cat.id,
    count: cat._count.id,
  }));
}

export async function getPriceRanges() {
  const products = await prisma.product.findMany({
    select: { price: true },
    orderBy: { price: Prisma.SortOrder.asc },
  });

  const ranges = [
    { min: 0, max: 50, label: 'Under $50' },
    { min: 50, max: 100, label: '$50 - $100' },
    { min: 100, max: 200, label: '$100 - $200' },
    { min: 200, max: 500, label: '$200 - $500' },
    { min: 500, max: null, label: '$500 and up' },
  ];

  return ranges.map(range => ({
    ...range,
    count: products.filter(p => {
      const price = p.price as unknown as Prisma.Decimal;
      return price.greaterThanOrEqualTo(range.min) && 
        (range.max === null || price.lessThanOrEqualTo(range.max));
    }).length,
  }));
}
