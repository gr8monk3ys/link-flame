'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import Link from 'next/link';

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
}

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
}

interface CategoryFilter {
  name: string;
  count: number;
}

function SearchSection({
  filters,
  onFilterChange,
}: FilterSidebarProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900">Search</h3>
      <div className="mt-4">
        <input
          type="text"
          id="search"
          name="search"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search products..."
          className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    </div>
  );
}

function CategoriesSection({
  categories,
  categoriesLoading,
  filters,
  onFilterChange,
}: {
  categories: CategoryFilter[];
  categoriesLoading: boolean;
} & FilterSidebarProps) {
  const categoryId = useCallback((name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900">Categories</h3>
      <div className="mt-4 space-y-4">
        {categoriesLoading ? (
          <>
            {['category-skeleton-1', 'category-skeleton-2', 'category-skeleton-3', 'category-skeleton-4'].map((key) => (
              <div key={key} className="flex items-center gap-3">
                <div className="size-4 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-500">No categories available.</p>
        ) : (
          categories.map((category) => {
            const id = categoryId(category.name);
            const selected = filters.categories.includes(category.name);

            return (
              <div key={category.name} className="flex items-center">
                <input
                  id={`category-${id}`}
                  type="checkbox"
                  name="category"
                  value={category.name}
                  checked={selected}
                  onChange={() => {
                    const newCategories = selected
                      ? filters.categories.filter((name) => name !== category.name)
                      : [...filters.categories, category.name];
                    onFilterChange({ categories: newCategories });
                  }}
                  className="size-4 rounded border-gray-300 text-green-600 focus:ring-ring"
                />
                <label
                  htmlFor={`category-${id}`}
                  className="ml-3 text-sm text-gray-600"
                >
                  {category.name}
                  <span className="ml-1 text-gray-400">({category.count})</span>
                </label>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RatingSection({
  filters,
  onFilterChange,
}: FilterSidebarProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900">Rating</h3>
      <div className="mt-4 space-y-4">
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() =>
              onFilterChange({
                rating: filters.rating === rating ? null : rating,
              })
            }
            className={`flex w-full items-center rounded-lg p-2 text-sm hover:bg-gray-50 ${
              filters.rating === rating ? 'bg-gray-100' : ''
            }`}
          >
            <div className="flex shrink-0">
              {[1, 2, 3, 4, 5].slice(0, rating).map((star) => (
                <Star fill="currentColor"
                  key={`filled-${rating}-${star}`}
                  className="size-5 text-yellow-400"
                  aria-hidden="true"
                />
              ))}
              {[1, 2, 3, 4, 5].slice(0, 5 - rating).map((star) => (
                <Star fill="currentColor"
                  key={`empty-${rating}-${star}`}
                  className="size-5 text-gray-300"
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="ml-2 text-gray-600">& Up</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PriceRangeSection({
  filters,
  onFilterChange,
}: FilterSidebarProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900">Price Range</h3>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="minPrice" className="sr-only">
            Minimum Price
          </label>
          <input
            type="number"
            id="minPrice"
            name="minPrice"
            placeholder="Min"
            value={filters.priceRange.min ?? ''}
            onChange={(e) =>
              onFilterChange({
                priceRange: {
                  ...filters.priceRange,
                  min: e.target.value ? Number(e.target.value) : null,
                },
              })
            }
            className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="maxPrice" className="sr-only">
            Maximum Price
          </label>
          <input
            type="number"
            id="maxPrice"
            name="maxPrice"
            placeholder="Max"
            value={filters.priceRange.max ?? ''}
            onChange={(e) =>
              onFilterChange({
                priceRange: {
                  ...filters.priceRange,
                  max: e.target.value ? Number(e.target.value) : null,
                },
              })
            }
            className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}

function DateRangeSection({
  filters,
  onFilterChange,
}: FilterSidebarProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900">Date Added</h3>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="sr-only">
            Start Date
          </label>
          <input
            type="date"
            id="start-date"
            name="startDate"
            value={filters.dateRange.start?.toISOString().split('T')[0] ?? ''}
            onChange={(e) =>
              onFilterChange({
                dateRange: {
                  ...filters.dateRange,
                  start: e.target.value ? new Date(e.target.value) : null,
                },
              })
            }
            className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="sr-only">
            End Date
          </label>
          <input
            type="date"
            id="end-date"
            name="endDate"
            value={filters.dateRange.end?.toISOString().split('T')[0] ?? ''}
            onChange={(e) =>
              onFilterChange({
                dateRange: {
                  ...filters.dateRange,
                  end: e.target.value ? new Date(e.target.value) : null,
                },
              })
            }
            className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}

function SubscribableSection({
  filters,
  onFilterChange,
}: FilterSidebarProps) {
  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg
          className="size-5 text-blue-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        <h3 className="text-lg font-medium text-blue-900">Subscribe &amp; Save</h3>
      </div>
      <p className="mb-4 text-sm text-blue-800">
        Set it and forget it. Save on recurring deliveries of your essentials.
      </p>
      <div className="flex items-center gap-3">
        <input
          id="subscribable-filter"
          type="checkbox"
          name="subscribable"
          checked={filters.subscribable === true}
          onChange={(e) =>
            onFilterChange({
              subscribable: e.target.checked ? true : null,
            })
          }
          className="size-4 rounded border-blue-300 text-blue-700 focus:ring-blue-500"
        />
        <label htmlFor="subscribable-filter" className="text-sm text-blue-800">
          Show only Subscribe &amp; Save items
        </label>
      </div>
    </div>
  );
}

function ImperfectSection({
  filters,
  onFilterChange,
}: FilterSidebarProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg
          className="size-5 text-amber-600"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
        </svg>
        <h3 className="text-lg font-medium text-amber-900">Perfectly Imperfect</h3>
      </div>
      <p className="mb-4 text-sm text-amber-800">
        Save up to 47% on items with minor cosmetic imperfections. Same quality, less waste.
      </p>
      <div className="mb-3 flex items-center gap-3">
        <input
          id="imperfect-filter"
          type="checkbox"
          name="imperfect"
          checked={filters.imperfect === true}
          onChange={(e) =>
            onFilterChange({
              imperfect: e.target.checked ? true : null,
            })
          }
          className="size-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
        />
        <label htmlFor="imperfect-filter" className="text-sm text-amber-800">
          Show only imperfect deals
        </label>
      </div>
      <Link
        href="/imperfect"
        className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800"
      >
        View all imperfect items
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </div>
  );
}

export default function FilterSidebar({
  filters,
  onFilterChange,
}: FilterSidebarProps) {
  const [categories, setCategories] = useState<CategoryFilter[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const loadCategories = useCallback(async (signal: AbortSignal) => {
    setCategoriesLoading(true);
    try {
      const response = await fetch('/api/products/categories', { signal });
      if (!response.ok) return;

      const payload = await response.json();
      const categoriesArray = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      if (signal.aborted) return;
      setCategories(categoriesArray);
    } catch (error) {
      if (!signal.aborted) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch product categories:', error);
        }
      }
    } finally {
      if (!signal.aborted) {
        setCategoriesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadCategories(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadCategories]);

  return (
    <div className="space-y-8">
      <SearchSection filters={filters} onFilterChange={onFilterChange} />
      <CategoriesSection
        categories={categories}
        categoriesLoading={categoriesLoading}
        filters={filters}
        onFilterChange={onFilterChange}
      />
      <RatingSection filters={filters} onFilterChange={onFilterChange} />
      <PriceRangeSection filters={filters} onFilterChange={onFilterChange} />
      <DateRangeSection filters={filters} onFilterChange={onFilterChange} />
      <SubscribableSection filters={filters} onFilterChange={onFilterChange} />
      <ImperfectSection filters={filters} onFilterChange={onFilterChange} />
    </div>
  );
}
