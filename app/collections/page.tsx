'use client';

import { useState, useEffect, useMemo } from 'react';
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
  values: string[]; // Sustainability value slugs
}

export default function CollectionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Get values from URL for "Shop by Values" filtering
  const urlValues = searchParams.get('values')?.split(',').filter(Boolean) || [];

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    rating: null,
    dateRange: {
      start: null,
      end: null,
    },
    priceRange: {
      min: null,
      max: null,
    },
    imperfect: null,
    values: urlValues,
  });

  // Sync URL values with filter state
  useEffect(() => {
    const newUrlValues = searchParams.get('values')?.split(',').filter(Boolean) || [];
    if (JSON.stringify(newUrlValues) !== JSON.stringify(filters.values)) {
      setFilters(prev => ({ ...prev, values: newUrlValues }));
      setCurrentPage(1);
    }
  }, [searchParams, filters.values]);

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
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
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
