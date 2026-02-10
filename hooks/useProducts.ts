import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';

// Fetcher function
const fetcher = async (url: string): Promise<unknown> => {
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

  const [data, setData] = useState<unknown>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const mutate = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const result = await fetcher(url);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mutate();
  }, [mutate]);

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
  const [data, setData] = useState<Product | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const url = id ? `/api/products/${id}` : null;

  const mutate = useCallback(async () => {
    if (!url) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(undefined);
    try {
      const result = await fetcher(url) as Product;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mutate();
  }, [mutate]);

  return {
    product: data,
    isLoading,
    isError: error,
    mutate,
  };
}
