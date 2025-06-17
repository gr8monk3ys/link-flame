'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  queryString: string;
}

function pushWithParams(
  pathname: string,
  router: ReturnType<typeof useRouter>,
  params: URLSearchParams
) {
  const query = params.toString();
  router.push(query ? `${pathname}?${query}` : pathname);
}

export function ActiveFilters({ className, queryString }: ActiveFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allValues, setAllValues] = useState<ProductValue[]>([]);

  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const selectedValueSlugs = useMemo(() => params.get('values')?.split(',').filter(Boolean) || [], [params]);
  const selectedCategories = useMemo(() => params.getAll('category').filter(Boolean), [params]);
  const searchQuery = params.get('search');
  const rating = params.get('rating');
  const startDate = params.get('startDate');
  const endDate = params.get('endDate');
  const minPrice = params.get('minPrice');
  const maxPrice = params.get('maxPrice');
  const imperfect = params.get('imperfect');
  const subscribable = params.get('subscribable');

  const loadValues = useCallback(async () => {
    try {
      const response = await fetch('/api/products/values');
      if (response.ok) {
        const data = await response.json();
        const valuesArray = Array.isArray(data) ? data : (data.data || []);
        setAllValues(valuesArray);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch product values:', error);
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadValues();
  }, [loadValues]);

  const removeValueFilter = useCallback((slug: string) => {
    const nextParams = new URLSearchParams(queryString);
    const nextSelectedValues = selectedValueSlugs.filter((value) => value !== slug);

    if (nextSelectedValues.length > 0) {
      nextParams.set('values', nextSelectedValues.join(','));
    } else {
      nextParams.delete('values');
    }
    nextParams.delete('page');
    pushWithParams(pathname, router, nextParams);
  }, [pathname, queryString, router, selectedValueSlugs]);

  const removeCategoryFilter = useCallback((categoryName: string) => {
    const nextParams = new URLSearchParams(queryString);
    const remaining = selectedCategories.filter((name) => name !== categoryName);
    nextParams.delete('category');
    remaining.forEach((name) => nextParams.append('category', name));
    nextParams.delete('page');
    pushWithParams(pathname, router, nextParams);
  }, [pathname, queryString, router, selectedCategories]);

  const removeSearchFilter = useCallback(() => {
    const nextParams = new URLSearchParams(queryString);
    nextParams.delete('search');
    nextParams.delete('page');
    pushWithParams(pathname, router, nextParams);
  }, [pathname, queryString, router]);

  const removeRatingFilter = useCallback(() => {
    const nextParams = new URLSearchParams(queryString);
    nextParams.delete('rating');
    nextParams.delete('page');
    pushWithParams(pathname, router, nextParams);
  }, [pathname, queryString, router]);

  const removeDateFilter = useCallback(() => {
    const nextParams = new URLSearchParams(queryString);
    nextParams.delete('startDate');
    nextParams.delete('endDate');
    nextParams.delete('page');
    pushWithParams(pathname, router, nextParams);
  }, [pathname, queryString, router]);

  const removePriceFilter = useCallback(() => {
    const nextParams = new URLSearchParams(queryString);
    nextParams.delete('minPrice');
    nextParams.delete('maxPrice');
    nextParams.delete('page');
    pushWithParams(pathname, router, nextParams);
  }, [pathname, queryString, router]);

  const removeImperfectFilter = useCallback(() => {
    const nextParams = new URLSearchParams(queryString);
    nextParams.delete('imperfect');
    nextParams.delete('page');
    pushWithParams(pathname, router, nextParams);
  }, [pathname, queryString, router]);

  const removeSubscribableFilter = useCallback(() => {
    const nextParams = new URLSearchParams(queryString);
    nextParams.delete('subscribable');
    nextParams.delete('page');
    pushWithParams(pathname, router, nextParams);
  }, [pathname, queryString, router]);

  const clearAllFilters = useCallback(() => {
    const nextParams = new URLSearchParams();
    const currentPageSize = params.get('pageSize');
    if (currentPageSize) {
      nextParams.set('pageSize', currentPageSize);
    }
    pushWithParams(pathname, router, nextParams);
  }, [params, pathname, router]);

  const activeFilters = useMemo(() => {
    const filters: Array<{ type: string; label: string; onRemove: () => void }> = [];

    if (searchQuery) {
      filters.push({
        type: 'search',
        label: `Search: ${searchQuery}`,
        onRemove: removeSearchFilter,
      });
    }

    selectedValueSlugs.forEach((slug) => {
      const value = allValues.find((item) => item.slug === slug);
      if (value) {
        filters.push({
          type: 'value',
          label: value.name,
          onRemove: () => removeValueFilter(slug),
        });
      }
    });

    selectedCategories.forEach((categoryName) => {
      filters.push({
        type: 'category',
        label: `Category: ${categoryName}`,
        onRemove: () => removeCategoryFilter(categoryName),
      });
    });

    if (rating) {
      filters.push({
        type: 'rating',
        label: `Rating: ${rating}+`,
        onRemove: removeRatingFilter,
      });
    }

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

      {activeFilters.map((filter) => (
        <span
          key={`${filter.type}-${filter.label}`}
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
