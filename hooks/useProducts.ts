import useSWR from 'swr';
import type { Product } from '@/types/product';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.message = await res.text();
    throw error;
  }
  
  return res.json();
};

type UseProductsOptions = {
  category?: string;
  limit?: number;
  featured?: boolean;
};

export function useProducts(options: UseProductsOptions = {}) {
  const { category, limit, featured } = options;
  
  // Build query string
  const queryParams = new URLSearchParams();
  if (category) queryParams.set('category', category);
  if (limit) queryParams.set('limit', limit.toString());
  if (featured) queryParams.set('featured', 'true');
  
  const queryString = queryParams.toString();
  const url = `/api/products${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR<unknown>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const products = Array.isArray(data)
    ? data
    : Array.isArray((data as { data?: Product[] })?.data)
      ? (data as { data?: Product[] }).data!
      : Array.isArray((data as { products?: Product[] })?.products)
        ? (data as { products?: Product[] }).products!
        : [];
  
  return {
    products,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useProduct(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Product>(
    id ? `/api/products/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 1 minute
    }
  );
  
  return {
    product: data,
    isLoading,
    isError: error,
    mutate,
  };
}
