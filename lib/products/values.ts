import { prisma } from "@/lib/prisma";

/**
 * A "Shop by Values" entry as the filter UI consumes it: the value itself plus
 * how many products carry it, flattened out of Prisma's `_count` shape.
 */
export interface ProductValueSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  sortOrder: number;
  productCount: number;
}

/**
 * The single source of the values list. Both `GET /api/products/values` (used
 * when the shopper changes a filter) and the catalogue page's server render
 * call this, so the list the server paints and the list the client later
 * refetches cannot disagree - a disagreement is a layout shift.
 */
export async function getProductValues(): Promise<ProductValueSummary[]> {
  const values = await prisma.productValue.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return values.map((value) => ({
    id: value.id,
    name: value.name,
    slug: value.slug,
    description: value.description,
    iconName: value.iconName,
    sortOrder: value.sortOrder,
    productCount: value._count.products,
  }));
}
