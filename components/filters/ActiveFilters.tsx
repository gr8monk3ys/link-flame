'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ProductValue {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  iconName?: string | null;
  productCount: number;
}

interface ActiveFiltersProps {
  className?: string;
}

export function ActiveFilters({ className }: ActiveFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allValues, setAllValues] = useState<ProductValue[]>([]);

  // Get currently selected values from URL - memoized to prevent recalculation
  const selectedValueSlugs = useMemo(() => {
    return searchParams.get('values')?.split(',').filter(Boolean) || [];
  }, [searchParams]);
  const selectedCategories = useMemo(() => {
    return searchParams.getAll('category').filter(Boolean);
  }, [searchParams]);
  const searchQuery = searchParams.get('search');
  const rating = searchParams.get('rating');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const imperfect = searchParams.get('imperfect');
  const subscribable = searchParams.get('subscribable');

  // Fetch all values to get names for active filters
  useEffect(() => {
    async function fetchValues() {
      try {
        const response = await fetch('/api/products/values');
        if (response.ok) {
          const data = await response.json();
          // Handle both wrapped response { data: [...] } and direct array
          const valuesArray = Array.isArray(data) ? data : (data.data || []);
          setAllValues(valuesArray);
        }
      } catch (error) {
        console.error('Failed to fetch product values:', error);
      }
    }
    fetchValues();
  }, []);

  // Remove a specific value filter
  const removeValueFilter = useCallback((slug: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const newSelectedValues = selectedValueSlugs.filter(v => v !== slug);

    if (newSelectedValues.length > 0) {
      newParams.set('values', newSelectedValues.join(','));
    } else {
      newParams.delete('values');
    }

    newParams.delete('page');
    router.push(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams, selectedValueSlugs]);

  // Remove a specific category filter
  const removeCategoryFilter = useCallback((categoryName: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const remaining = selectedCategories.filter((name) => name !== categoryName);
    newParams.delete('category');
    remaining.forEach((name) => newParams.append('category', name));
    newParams.delete('page');
    router.push(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams, selectedCategories]);

  const removeSearchFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('search');
    newParams.delete('page');
    router.push(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams]);

  const removeRatingFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('rating');
    newParams.delete('page');
    router.push(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams]);

  const removeDateFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('startDate');
    newParams.delete('endDate');
    newParams.delete('page');
    router.push(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams]);

  // Remove price filter
  const removePriceFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('minPrice');
    newParams.delete('maxPrice');
    newParams.delete('page');
    router.push(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams]);

  const removeImperfectFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('imperfect');
    newParams.delete('page');
    router.push(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams]);

  const removeSubscribableFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('subscribable');
    newParams.delete('page');
    router.push(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const newParams = new URLSearchParams();
    // Preserve pageSize if the user chose a custom size.
    const currentPageSize = searchParams.get('pageSize');
    if (currentPageSize) {
      newParams.set('pageSize', currentPageSize);
    }

    const url = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname;
    router.push(url);
  }, [pathname, router, searchParams]);

  // Memoize the active filters list to prevent recalculation on every render
  const activeFilters = useMemo(() => {
    const filters: Array<{ type: string; label: string; onRemove: () => void }> = [];

    // Search
    if (searchQuery) {
      filters.push({
        type: 'search',
        label: `Search: ${searchQuery}`,
        onRemove: removeSearchFilter,
      });
    }

    // Add value filters
    selectedValueSlugs.forEach((slug) => {
      const value = allValues.find(v => v.slug === slug);
      if (value) {
        filters.push({
          type: 'value',
          label: value.name,
          onRemove: () => removeValueFilter(slug),
        });
      }
    });

    // Categories (multi)
    selectedCategories.forEach((categoryName) => {
      filters.push({
        type: 'category',
        label: `Category: ${categoryName}`,
        onRemove: () => removeCategoryFilter(categoryName),
      });
    });

    // Rating
    if (rating) {
      filters.push({
        type: 'rating',
        label: `Rating: ${rating}+`,
        onRemove: removeRatingFilter,
      });
    }

    // Date range
    if (startDate || endDate) {
      const label = startDate && endDate
        ? `Date: ${startDate.split('T')[0]} - ${endDate.split('T')[0]}`
        : startDate
          ? `Date: from ${startDate.split('T')[0]}`
          : `Date: until ${endDate?.split('T')[0]}`;
      filters.push({
        type: 'date',
        label,
        onRemove: removeDateFilter,
      });
    }

    // Add price filter
    if (minPrice || maxPrice) {
      let priceLabel = 'Price: ';
      if (minPrice && maxPrice) {
        priceLabel += `$${minPrice} - $${maxPrice}`;
      } else if (minPrice) {
        priceLabel += `$${minPrice}+`;
      } else if (maxPrice) {
        priceLabel += `Up to $${maxPrice}`;
      }
      filters.push({
        type: 'price',
        label: priceLabel,
        onRemove: removePriceFilter,
      });
    }

    if (imperfect === 'true') {
      filters.push({
        type: 'imperfect',
        label: 'Perfectly Imperfect',
        onRemove: removeImperfectFilter,
      });
    }

    if (subscribable === 'true') {
      filters.push({
        type: 'subscribable',
        label: 'Subscribe & Save',
        onRemove: removeSubscribableFilter,
      });
    }

    return filters;
  }, [
    allValues,
    endDate,
    imperfect,
    maxPrice,
    minPrice,
    rating,
    removeCategoryFilter,
    removeDateFilter,
    removeImperfectFilter,
    removePriceFilter,
    removeRatingFilter,
    removeSearchFilter,
    removeSubscribableFilter,
    removeValueFilter,
    searchQuery,
    selectedCategories,
    selectedValueSlugs,
    startDate,
    subscribable,
  ]);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="mr-1 text-sm text-gray-500">Active filters:</span>

      {activeFilters.map((filter, index) => (
        <span
          key={`${filter.type}-${index}`}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-sm text-gray-700"
        >
          {filter.label}
          <button
            onClick={filter.onRemove}
            className="ml-1 rounded-full p-0.5 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={`Remove ${filter.label} filter`}
          >
            <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}

      {activeFilters.length > 1 && (
        <button
          onClick={clearAllFilters}
          className="ml-2 text-sm text-gray-500 underline hover:text-gray-700"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
