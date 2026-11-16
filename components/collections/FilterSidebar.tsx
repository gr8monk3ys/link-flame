'use client';

import { useCallback, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

interface FilterState {
  search: string;
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'rating';
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

function SortSection({
  filters,
  onFilterChange,
}: FilterSidebarProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-foreground">Sort</h3>
      <div className="mt-4">
        {/* The native <select> was the one unstyled control on an otherwise
            custom page. This is the same Radix Select the rest of the app uses. */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            onFilterChange({ sortBy: value as FilterState['sortBy'] })
          }
        >
          <SelectTrigger
            id="sortBy"
            aria-label="Sort products"
            className="h-10 w-full border-border bg-background text-sm shadow-xs"
          >
            <SelectValue placeholder="Newest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SearchSection({
  filters,
  onFilterChange,
}: FilterSidebarProps) {
  return (
    <div>
      <h3 className="text-lg font-medium text-foreground">Search</h3>
      <div className="mt-4">
        {/* The "Search" heading above is not a label - nothing associates it
            with the field, so assistive tech announced an unnamed textbox. */}
        <label htmlFor="search" className="sr-only">
          Search products
        </label>
        <input autoComplete="off"
          type="text"
          id="search"
          name="search"
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search products…"
          className="w-full rounded-md border border-border p-2 text-sm shadow-xs focus-visible:border-primary focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
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
      <h3 className="text-lg font-medium text-foreground">Categories</h3>
      <div className="mt-4 space-y-4">
        {categoriesLoading ? (
          <>
            {['category-skeleton-1', 'category-skeleton-2', 'category-skeleton-3', 'category-skeleton-4'].map((key) => (
              <div key={key} className="flex items-center gap-3">
                <div className="size-4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories available.</p>
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
                  className="size-4 rounded border-border text-green-700 focus-visible:ring-ring dark:text-green-400"
                />
                <label
                  htmlFor={`category-${id}`}
                  className="ml-3 text-sm text-muted-foreground"
                >
                  {category.name}
                  <span className="ml-1 text-muted-foreground">({category.count})</span>
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
      <h3 className="text-lg font-medium text-foreground">Rating</h3>
      <div className="mt-4 space-y-4">
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            type="button"
            aria-pressed={filters.rating === rating}
            aria-label={`${rating} stars and up`}
            onClick={() =>
              onFilterChange({
                rating: filters.rating === rating ? null : rating,
              })
            }
            className={`flex w-full items-center rounded-lg p-2 text-sm hover:bg-muted ${
              filters.rating === rating ? 'bg-muted' : ''
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
                  className="size-5 text-muted-foreground/40"
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="ml-2 text-muted-foreground">& Up</span>
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
      <h3 className="text-lg font-medium text-foreground">Price Range</h3>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="minPrice" className="sr-only">
            Minimum Price
          </label>
          <input inputMode="decimal" autoComplete="off"
            type="number"
            id="minPrice"
            name="minPrice"
            placeholder="e.g. 10"
            value={filters.priceRange.min ?? ''}
            onChange={(e) =>
              onFilterChange({
                priceRange: {
                  ...filters.priceRange,
                  min: e.target.value ? Number(e.target.value) : null,
                },
              })
            }
            className="w-full rounded-md border border-border p-2 text-sm shadow-xs focus-visible:border-primary focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="maxPrice" className="sr-only">
            Maximum Price
          </label>
          <input inputMode="decimal" autoComplete="off"
            type="number"
            id="maxPrice"
            name="maxPrice"
            placeholder="e.g. 50"
            value={filters.priceRange.max ?? ''}
            onChange={(e) =>
              onFilterChange({
                priceRange: {
                  ...filters.priceRange,
                  max: e.target.value ? Number(e.target.value) : null,
                },
              })
            }
            className="w-full rounded-md border border-border p-2 text-sm shadow-xs focus-visible:border-primary focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
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
      <h3 className="text-lg font-medium text-foreground">Date Added</h3>
      {/* Stacked in the narrow lg sidebar: side by side, a native date field
          clips its own mm/dd/yyyy placeholder at 256px. */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
        <div className="space-y-1.5">
          <label
            htmlFor="start-date"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            From
          </label>
          <input autoComplete="off"
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
            className={`date-field ${
              filters.dateRange.start ? 'text-foreground' : 'text-muted-foreground'
            }`}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="end-date"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            To
          </label>
          <input autoComplete="off"
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
            className={`date-field ${
              filters.dateRange.end ? 'text-foreground' : 'text-muted-foreground'
            }`}
          />
        </div>
      </div>
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
      <SortSection filters={filters} onFilterChange={onFilterChange} />
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
    </div>
  );
}
