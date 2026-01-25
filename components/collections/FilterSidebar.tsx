'use client';

import { useState } from 'react';
import { StarIcon } from '@heroicons/react/20/solid';
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
}

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
}

export default function FilterSidebar({
  filters,
  onFilterChange,
}: FilterSidebarProps) {
  const [categories] = useState([
    { id: 'electronics', name: 'Electronics', count: 35 },
    { id: 'clothing', name: 'Clothing', count: 42 },
    { id: 'books', name: 'Books', count: 28 },
    { id: 'home', name: 'Home & Garden', count: 31 },
    { id: 'sports', name: 'Sports', count: 19 },
  ]);

  return (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Search</h3>
        <div className="mt-4">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search products..."
            className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Categories</h3>
        <div className="mt-4 space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center">
              <input
                id={`category-${category.id}`}
                type="checkbox"
                checked={filters.categories.includes(category.id)}
                onChange={() => {
                  const newCategories = filters.categories.includes(category.id)
                    ? filters.categories.filter((id) => id !== category.id)
                    : [...filters.categories, category.id];
                  onFilterChange({ categories: newCategories });
                }}
                className="size-4 rounded border-gray-300 text-green-600 focus:ring-ring"
              />
              <label
                htmlFor={`category-${category.id}`}
                className="ml-3 text-sm text-gray-600"
              >
                {category.name}
                <span className="ml-1 text-gray-400">({category.count})</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Filter */}
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
                {[...Array(rating)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className="size-5 text-yellow-400"
                    aria-hidden="true"
                  />
                ))}
                {[...Array(5 - rating)].map((_, i) => (
                  <StarIcon
                    key={i}
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

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Price Range</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="min-price" className="sr-only">
              Minimum Price
            </label>
            <input
              type="number"
              id="min-price"
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
            <label htmlFor="max-price" className="sr-only">
              Maximum Price
            </label>
            <input
              type="number"
              id="max-price"
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

      {/* Date Range */}
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

      {/* Perfectly Imperfect Section */}
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
    </div>
  );
}
