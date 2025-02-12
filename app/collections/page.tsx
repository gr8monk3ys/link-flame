'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import FilterSidebar from '@/components/collections/FilterSidebar';
import ProductGrid from '@/components/collections/ProductGrid';

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
}

export default function CollectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  
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
  });

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
    
    params.append('page', currentPage.toString());
    params.append('pageSize', pageSize.toString());
    
    return params;
  }, [
    debouncedSearch,
    filters.categories,
    filters.rating,
    filters.dateRange,
    debouncedPriceRange,
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
        setProducts(data.products);
        setTotalPages(Math.ceil(data.total / pageSize));
      } catch (error) {
        console.error('Error fetching products:', error);
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
      <div className="flex flex-col gap-8 py-8 lg:flex-row">
        <div className="w-full lg:w-64">
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
