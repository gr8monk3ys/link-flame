'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  ImperfectBanner,
  ImperfectProductGrid,
  ImperfectExplainer,
} from '@/components/imperfect';

interface ImperfectProduct {
  id: string;
  title: string;
  description?: string | null;
  image: string;
  category: string;
  inventory?: number;
  hasVariants?: boolean;
  originalPrice: number;
  salePrice?: number | null;
  imperfectPrice: number;
  discountPercent: number;
  totalSavings: number;
  imperfectReason?: string | null;
  imperfectReasonLabel?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
}

interface FilterState {
  category: string;
  minDiscount: number | null;
  sortBy: string;
}

const SORT_OPTIONS = [
  { value: 'discount_desc', label: 'Biggest Savings First' },
  { value: 'discount_asc', label: 'Smallest Savings First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
];

const DISCOUNT_OPTIONS = [
  { value: null, label: 'Any discount' },
  { value: 20, label: '20% off or more' },
  { value: 30, label: '30% off or more' },
  { value: 40, label: '40% off or more' },
  { value: 50, label: '50% off or more' },
];

/**
 * Perfectly Imperfect Collection Page
 * Showcases products with minor cosmetic issues at significant discounts
 * Emphasizes waste reduction and sustainability messaging
 */
export default function ImperfectPage() {
  const [products, setProducts] = useState<ImperfectProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(12);

  const [filters, setFilters] = useState<FilterState>({
    category: '',
    minDiscount: null,
    sortBy: 'discount_desc',
  });

  const debouncedFilters = useDebounce(filters, 300);

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    params.append('pageSize', pageSize.toString());

    if (debouncedFilters.category) {
      params.append('category', debouncedFilters.category);
    }
    if (debouncedFilters.minDiscount !== null) {
      params.append('minDiscount', debouncedFilters.minDiscount.toString());
    }
    if (debouncedFilters.sortBy) {
      params.append('sortBy', debouncedFilters.sortBy);
    }

    return params;
  }, [currentPage, pageSize, debouncedFilters]);

  // Fetch imperfect products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/products/imperfect?${queryParams.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch imperfect products');
        }

        const data = await response.json();

        setProducts(data.data || []);
        setTotalPages(data.meta?.pagination?.totalPages || 1);
        setTotalItems(data.meta?.pagination?.total || 0);

        // Extract unique categories from products
        const uniqueCategories = [...new Set(data.data?.map((p: ImperfectProduct) => p.category) || [])];
        setCategories(uniqueCategories as string[]);
      } catch (err) {
        console.error('Error fetching imperfect products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [queryParams]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <ImperfectBanner variant="hero" showCTA={false} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Filters Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <LeafIcon className="size-5 text-amber-600" />
            <p className="text-gray-700">
              <span className="font-semibold text-amber-600">{totalItems}</span> imperfect items available
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-amber-500 focus:ring-amber-500"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Discount Filter */}
            <select
              value={filters.minDiscount ?? ''}
              onChange={(e) =>
                handleFilterChange({
                  minDiscount: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-amber-500 focus:ring-amber-500"
              aria-label="Filter by discount"
            >
              {DISCOUNT_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value ?? ''}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-amber-500 focus:ring-amber-500"
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Try again
            </button>
          </div>
        )}

        {/* Products Grid */}
        <ImperfectProductGrid products={products} isLoading={isLoading} />

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      page === currentPage
                        ? 'bg-amber-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* How it works / Explainer section */}
        <div className="mt-24">
          <ImperfectExplainer variant="full" />
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <ImperfectExplainer variant="faq" />
        </div>
      </div>
    </div>
  );
}

// Icon component
function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
    </svg>
  );
}
