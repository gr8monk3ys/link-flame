'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import FilterSidebar from '@/components/collections/FilterSidebar';
import ProductGrid from '@/components/collections/ProductGrid';
import { ValueFilterBar, ValueFilterSidebar, ActiveFilters } from '@/components/filters';

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
  // Imperfect product fields
  isImperfect?: boolean;
  imperfectReason?: string | null;
  imperfectDiscount?: number | null;
  imperfectPrice?: number | null;
  // Sustainability values
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
  values: string[]; // Sustainability value slugs
}

export default function CollectionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(() => {
    const value = searchParams.get('page');
    const page = value ? Number(value) : 1;
    return Number.isFinite(page) && page > 0 ? page : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const value = searchParams.get('pageSize');
    const size = value ? Number(value) : 12;
    return Number.isFinite(size) && size > 0 ? size : 12;
  });

  const parseDateParam = (value: string | null): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const parseNumberParam = (value: string | null): number | null => {
    if (value === null || value.trim().length === 0) return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  };

  const parseBooleanParam = (value: string | null): boolean | null => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  };

  const parseFiltersFromUrl = useCallback((): FilterState => {
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
  }, [searchParams]);

  const [filters, setFilters] = useState<FilterState>(() => parseFiltersFromUrl());

  const serializeFilters = useCallback((value: FilterState) => {
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
  }, []);

  // Keep local state synchronized with URL params (supports deep-links + back/forward navigation).
  useEffect(() => {
    const nextFilters = parseFiltersFromUrl();
    setFilters((prev) => (serializeFilters(prev) === serializeFilters(nextFilters) ? prev : nextFilters));

    const nextPageRaw = searchParams.get('page');
    const nextPage = nextPageRaw ? Number(nextPageRaw) : 1;
    setCurrentPage((prev) => (Number.isFinite(nextPage) && nextPage > 0 && prev !== nextPage ? nextPage : prev));

    const nextSizeRaw = searchParams.get('pageSize');
    const nextPageSize = nextSizeRaw ? Number(nextSizeRaw) : 12;
    setPageSize((prev) => (Number.isFinite(nextPageSize) && nextPageSize > 0 && prev !== nextPageSize ? nextPageSize : prev));
  }, [parseFiltersFromUrl, searchParams, serializeFilters]);

  const syncUrl = useCallback(
    (nextFilters: FilterState, nextPage: number, nextPageSize: number) => {
      const params = new URLSearchParams(searchParams.toString());

      // Search
      if (nextFilters.search.trim().length > 0) {
        params.set('search', nextFilters.search);
      } else {
        params.delete('search');
      }

      // Categories (multi)
      params.delete('category');
      nextFilters.categories.forEach((category) => params.append('category', category));

      // Rating
      if (nextFilters.rating !== null) {
        params.set('rating', nextFilters.rating.toString());
      } else {
        params.delete('rating');
      }

      // Dates
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

      // Price
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

      // Imperfect + Subscribe & Save
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

      // Values (comma-separated)
      if (nextFilters.values.length > 0) {
        params.set('values', nextFilters.values.join(','));
      } else {
        params.delete('values');
      }

      // Pagination
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

  // Debounce search input
  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedPriceRange = useDebounce(filters.priceRange, 300);

  // Memoize the query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (filters.categories.length > 0) {
      filters.categories.forEach(cat => params.append('category', cat));
    }
    if (filters.rating !== null) params.append('rating', filters.rating.toString());
    if (filters.dateRange.start) params.append('startDate', filters.dateRange.start.toISOString());
    if (filters.dateRange.end) params.append('endDate', filters.dateRange.end.toISOString());
    if (debouncedPriceRange.min !== null) params.append('minPrice', debouncedPriceRange.min.toString());
    if (debouncedPriceRange.max !== null) params.append('maxPrice', debouncedPriceRange.max.toString());
    if (filters.imperfect === true) params.append('imperfect', 'true');
    if (filters.subscribable === true) params.append('subscribable', 'true');

    // Add sustainability values filter
    if (filters.values.length > 0) {
      params.append('values', filters.values.join(','));
    }

    params.append('page', currentPage.toString());
    params.append('pageSize', pageSize.toString());

    return params;
  }, [
    debouncedSearch,
    filters.categories,
    filters.rating,
    filters.dateRange,
    debouncedPriceRange,
    filters.imperfect,
    filters.subscribable,
    filters.values,
    currentPage,
    pageSize,
  ]);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products?${queryParams.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        if (data?.success && Array.isArray(data.data)) {
          setProducts(data.data);
          setTotalPages(data.meta?.pagination?.totalPages ?? 1);
        } else if (Array.isArray(data.products)) {
          setProducts(data.products);
          setTotalPages(Math.ceil((data.total || 0) / pageSize));
        } else {
          setProducts([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [queryParams, pageSize]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const nextFilters = { ...filters, ...newFilters };
    setFilters(nextFilters);
    setCurrentPage(1); // Reset to first page when filters change
    syncUrl(nextFilters, 1, pageSize);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    syncUrl(filters, page, pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
    syncUrl(filters, 1, size);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Shop by Values - Horizontal Filter Bar */}
      <div className="border-b border-gray-200 py-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Shop by Values</h2>
        <ValueFilterBar />
      </div>

      {/* Active Filters Display */}
      <ActiveFilters className="py-4" />

      <div className="flex flex-col gap-8 py-8 lg:flex-row">
        <div className="w-full space-y-6 lg:w-64">
          {/* Values Sidebar Filter */}
          <ValueFilterSidebar
            title="Values"
            collapsible={true}
            defaultExpanded={true}
          />

          {/* Existing Filters */}
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
