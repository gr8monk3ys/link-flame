interface Category {
  id: string;
  name: string;
}

export async function getProductCategories(): Promise<Category[]> {
  try {
    const res = await fetch("/api/products/categories");
    if (!res.ok) {
      console.error("Failed to fetch product categories");
      return [];
    }
    const categories = await res.json() as Category[];
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
