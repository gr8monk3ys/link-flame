'use client';

import { useCallback, useEffect, useState } from 'react';
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

interface ValueFilterSidebarProps {
  className?: string;
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function ValueFilterSidebar({
  className,
  title = 'Shop by Values',
  collapsible = true,
  defaultExpanded = true,
}: ValueFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [values, setValues] = useState<ProductValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Get currently selected values from URL
  const selectedValues = searchParams.get('values')?.split(',').filter(Boolean) || [];

  // Fetch available values
  useEffect(() => {
    async function fetchValues() {
      try {
        const response = await fetch('/api/products/values');
        if (response.ok) {
          const data = await response.json();
          setValues(data);
        }
      } catch (error) {
        console.error('Failed to fetch product values:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchValues();
  }, []);

  // Toggle value selection
  const toggleValue = useCallback((slug: string) => {
    const newParams = new URLSearchParams(searchParams.toString());

    let newSelectedValues: string[];
    if (selectedValues.includes(slug)) {
      newSelectedValues = selectedValues.filter(v => v !== slug);
    } else {
      newSelectedValues = [...selectedValues, slug];
    }

    if (newSelectedValues.length > 0) {
      newParams.set('values', newSelectedValues.join(','));
    } else {
      newParams.delete('values');
    }

    // Reset to page 1 when filters change
    newParams.delete('page');

    router.push(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams, selectedValues]);

  // Clear all value filters
  const clearAll = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('values');
    newParams.delete('page');
    router.push(`${pathname}?${newParams.toString()}`);
  }, [pathname, router, searchParams]);

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (values.length === 0) {
    return null;
  }

  return (
    <div className={cn('', className)}>
      {/* Header with optional collapse */}
      <div
        className={cn(
          'flex items-center justify-between mb-4',
          collapsible && 'cursor-pointer'
        )}
        onClick={collapsible ? () => setExpanded(!expanded) : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? expanded : undefined}
      >
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          {selectedValues.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          )}
          {collapsible && (
            <svg
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                expanded && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Value list */}
      {(!collapsible || expanded) && (
        <div className="space-y-2">
          {values.map((value) => {
            const isSelected = selectedValues.includes(value.slug);
            const hasProducts = value.productCount > 0;

            return (
              <label
                key={value.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer',
                  hasProducts
                    ? 'hover:bg-gray-50'
                    : 'opacity-50 cursor-not-allowed',
                  isSelected && 'bg-green-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => hasProducts && toggleValue(value.slug)}
                  disabled={!hasProducts}
                  className={cn(
                    'w-4 h-4 rounded border-gray-300',
                    'focus:ring-green-500 focus:ring-offset-0',
                    'text-green-600',
                    !hasProducts && 'cursor-not-allowed'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-sm',
                      isSelected ? 'font-medium text-gray-900' : 'text-gray-700'
                    )}>
                      {value.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {value.productCount}
                    </span>
                  </div>
                  {value.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {value.description}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
