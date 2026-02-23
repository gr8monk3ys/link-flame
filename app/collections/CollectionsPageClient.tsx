'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import FilterSidebar from '@/components/collections/FilterSidebar';
import ProductGrid from '@/components/collections/ProductGrid';
import { ValueFilterBar, ValueFilterSidebar, ActiveFilters } from '@/components/filters';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface ProductValue {
  id: string;
  name: string;
  slug: string;
  iconName?: string | null;
}

interface Product {
  id: string;
  title: string;
  price: number;
  salePrice?: number;
  image: string;
  category: string;
  description?: string;
  reviews: { rating: number }[];
  createdAt: Date;
  isSubscribable?: boolean;
  isImperfect?: boolean;
  imperfectReason?: string | null;
  imperfectDiscount?: number | null;
  imperfectPrice?: number | null;
  values?: ProductValue[];
}

interface FilterState {
  search: string;
  categories: string[];
  rating: number | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  priceRange: {
    min: number | null;
    max: number | null;
  };
  imperfect?: boolean | null;
  subscribable?: boolean | null;
  values: string[];
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNumberParam(value: string | null): number | null {
  if (value === null || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePositiveNumber(value: string | null, fallback: number): number {
  const parsed = value ? Number(value) : fallback;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBooleanParam(value: string | null): boolean | null {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function parseFiltersFromSearchParams(searchParams: URLSearchParams): FilterState {
  const valuesParam = searchParams.get('values') || '';
  const values = valuesParam
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    search: searchParams.get('search') || '',
    categories: searchParams.getAll('category').filter(Boolean),
    rating: (() => {
      const value = parseNumberParam(searchParams.get('rating'));
      if (value === null) return null;
      const rating = Math.floor(value);
      return rating >= 1 && rating <= 5 ? rating : null;
    })(),
    dateRange: {
      start: parseDateParam(searchParams.get('startDate')),
      end: parseDateParam(searchParams.get('endDate')),
    },
    priceRange: {
      min: parseNumberParam(searchParams.get('minPrice')),
      max: parseNumberParam(searchParams.get('maxPrice')),
    },
    imperfect: parseBooleanParam(searchParams.get('imperfect')) === true ? true : null,
    subscribable: parseBooleanParam(searchParams.get('subscribable')) === true ? true : null,
    values,
  };
}

function serializeFilters(value: FilterState): string {
  return JSON.stringify({
    search: value.search,
    categories: [...value.categories].sort(),
    rating: value.rating,
    startDate: value.dateRange.start?.toISOString() ?? null,
    endDate: value.dateRange.end?.toISOString() ?? null,
    minPrice: value.priceRange.min,
    maxPrice: value.priceRange.max,
    imperfect: value.imperfect === true,
    subscribable: value.subscribable === true,
    values: [...value.values].sort(),
  });
}

function useCollectionsPageState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>(() => {
    return {
      currentPage: parsePositiveNumber(searchParams.get('page'), 1),
      totalPages: 1,
      pageSize: parsePositiveNumber(searchParams.get('pageSize'), 12),
    };
  });
  const [filters, setFilters] = useState<FilterState>(() => parseFiltersFromSearchParams(searchParams));

  const { currentPage, totalPages, pageSize } = pagination;

  useEffect(() => {
    const nextFilters = parseFiltersFromSearchParams(searchParams);
    setFilters((prev) => (serializeFilters(prev) === serializeFilters(nextFilters) ? prev : nextFilters));

    const nextPage = parsePositiveNumber(searchParams.get('page'), 1);
    const nextPageSize = parsePositiveNumber(searchParams.get('pageSize'), 12);
    setPagination((prev) => {
      if (prev.currentPage === nextPage && prev.pageSize === nextPageSize) {
        return prev;
      }

      return {
        ...prev,
        currentPage: nextPage,
        pageSize: nextPageSize,
      };
    });
  }, [searchParams]);

  const syncUrl = useCallback(
    (nextFilters: FilterState, nextPage: number, nextPageSize: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextFilters.search.trim().length > 0) {
        params.set('search', nextFilters.search);
      } else {
        params.delete('search');
      }

      params.delete('category');
      nextFilters.categories.forEach((category) => params.append('category', category));

      if (nextFilters.rating !== null) {
        params.set('rating', nextFilters.rating.toString());
      } else {
        params.delete('rating');
      }

      if (nextFilters.dateRange.start) {
        params.set('startDate', nextFilters.dateRange.start.toISOString());
      } else {
        params.delete('startDate');
      }

      if (nextFilters.dateRange.end) {
        params.set('endDate', nextFilters.dateRange.end.toISOString());
      } else {
        params.delete('endDate');
      }

      if (nextFilters.priceRange.min !== null) {
        params.set('minPrice', nextFilters.priceRange.min.toString());
      } else {
        params.delete('minPrice');
      }

      if (nextFilters.priceRange.max !== null) {
        params.set('maxPrice', nextFilters.priceRange.max.toString());
      } else {
        params.delete('maxPrice');
      }

      if (nextFilters.imperfect === true) {
        params.set('imperfect', 'true');
      } else {
        params.delete('imperfect');
      }

      if (nextFilters.subscribable === true) {
        params.set('subscribable', 'true');
      } else {
        params.delete('subscribable');
      }

      if (nextFilters.values.length > 0) {
        params.set('values', nextFilters.values.join(','));
      } else {
        params.delete('values');
      }

      if (Number.isFinite(nextPage) && nextPage > 0) {
        params.set('page', nextPage.toString());
      } else {
        params.delete('page');
      }

      if (Number.isFinite(nextPageSize) && nextPageSize > 0) {
        params.set('pageSize', nextPageSize.toString());
      } else {
        params.delete('pageSize');
      }

      const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(url, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedPriceRange = useDebounce(filters.priceRange, 300);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) params.append('search', debouncedSearch);
    if (filters.categories.length > 0) {
      filters.categories.forEach((category) => params.append('category', category));
    }
    if (filters.rating !== null) params.append('rating', filters.rating.toString());
    if (filters.dateRange.start) params.append('startDate', filters.dateRange.start.toISOString());
    if (filters.dateRange.end) params.append('endDate', filters.dateRange.end.toISOString());
    if (debouncedPriceRange.min !== null) params.append('minPrice', debouncedPriceRange.min.toString());
    if (debouncedPriceRange.max !== null) params.append('maxPrice', debouncedPriceRange.max.toString());
    if (filters.imperfect === true) params.append('imperfect', 'true');
    if (filters.subscribable === true) params.append('subscribable', 'true');
    if (filters.values.length > 0) {
      params.append('values', filters.values.join(','));
    }

    params.append('page', currentPage.toString());
    params.append('pageSize', pageSize.toString());
    return params;
  }, [
    currentPage,
    debouncedPriceRange,
    debouncedSearch,
    filters.categories,
    filters.dateRange,
    filters.imperfect,
    filters.rating,
    filters.subscribable,
    filters.values,
    pageSize,
  ]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      if (data?.success && Array.isArray(data.data)) {
        setProducts(data.data);
        setPagination((prev) => ({ ...prev, totalPages: data.meta?.pagination?.totalPages ?? 1 }));
      } else if (Array.isArray(data.products)) {
        setProducts(data.products);
        setPagination((prev) => ({ ...prev, totalPages: Math.ceil((data.total || 0) / pageSize) }));
      } else {
        setProducts([]);
        setPagination((prev) => ({ ...prev, totalPages: 1 }));
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching products:', error);
      }
      setProducts([]);
      setPagination((prev) => ({ ...prev, totalPages: 1 }));
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, queryParams]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterState>) => {
      const nextFilters = { ...filters, ...newFilters };
      setFilters(nextFilters);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
      syncUrl(nextFilters, 1, pageSize);
    },
    [filters, pageSize, syncUrl]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setPagination((prev) => ({ ...prev, currentPage: page }));
      syncUrl(filters, page, pageSize);
    },
    [filters, pageSize, syncUrl]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPagination((prev) => ({ ...prev, currentPage: 1, pageSize: size }));
      syncUrl(filters, 1, size);
    },
    [filters, syncUrl]
  );

  return {
    filters,
    queryString: searchParams.toString(),
    products,
    isLoading,
    currentPage,
    totalPages,
    pageSize,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
  };
}

export default function CollectionsPageClient() {
  const {
    filters,
    queryString,
    products,
    isLoading,
    currentPage,
    totalPages,
    pageSize,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
  } = useCollectionsPageState();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="border-b border-gray-200 py-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Shop by Values</h2>
        <ValueFilterBar />
      </div>

      <ActiveFilters className="py-4" queryString={queryString} />

      <div className="flex flex-col gap-8 py-8 lg:flex-row">
        <div className="w-full space-y-6 lg:w-64">
          <ValueFilterSidebar
            title="Values"
            collapsible={true}
            defaultExpanded={true}
          />
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>
        <div className="flex-1">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>
    </div>
  );
}
