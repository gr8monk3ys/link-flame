import { prisma } from '@/lib/prisma';

export type ProductFilter = {
  categories?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  sortBy?: 'price_asc' | 'price_desc' | 'newest';
};

export async function getProducts(filters: ProductFilter = {}) {
  const where = {
    AND: [
      filters.categories?.length 
        ? { category: { in: filters.categories } }
        : {},
      filters.priceRange?.min !== undefined
        ? { price: { gte: filters.priceRange.min } }
        : {},
      filters.priceRange?.max !== undefined
        ? { price: { lte: filters.priceRange.max } }
        : {},
    ],
  };

  const orderBy = filters.sortBy 
    ? filters.sortBy === 'newest'
      ? { createdAt: 'desc' }
      : { price: filters.sortBy === 'price_asc' ? 'asc' : 'desc' }
    : { createdAt: 'desc' };

  return prisma.product.findMany({
    where,
    orderBy,
    include: {
      reviews: {
        select: {
          rating: true,
        },
      },
    },
  });
}

export async function getProductCategories() {
  const categories = await prisma.product.groupBy({
    by: ['category'],
    _count: {
      category: true,
    },
  });

  return categories.map(cat => ({
    id: cat.category,
    label: cat.category,
    count: cat._count.category,
  }));
}

export async function getPriceRanges() {
  const products = await prisma.product.findMany({
    select: { price: true },
    orderBy: { price: 'asc' },
  });

  const ranges = [
    { min: 0, max: 10, label: 'Under $10' },
    { min: 10, max: 20, label: '$10 - $20' },
    { min: 20, max: 30, label: '$20 - $30' },
    { min: 30, max: null, label: 'Over $30' },
  ];

  return ranges.map(range => ({
    id: `${range.min}-${range.max ?? 'max'}`,
    label: range.label,
    count: products.filter(p => 
      p.price >= range.min && 
      (range.max === null || p.price <= range.max)
    ).length,
  }));
}
