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

interface ValueFilterSidebarProps {
  className?: string;
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  /**
   * Values rendered by the server. Without them this list starts as a five-row
   * skeleton and grows to however many values the database holds - roughly
   * 900px of growth in the left column, above the fold, on every page load.
   */
  initialValues?: ProductValue[];
}

export function ValueFilterSidebar({
  className,
  title = 'Shop by Values',
  collapsible = true,
  defaultExpanded = true,
  initialValues,
}: ValueFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [values, setValues] = useState<ProductValue[]>(initialValues ?? []);
  const [loading, setLoading] = useState(!initialValues);
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Get currently selected values from URL - memoized to prevent recalculation
  const selectedValues = useMemo(() => {
    return searchParams.get('values')?.split(',').filter(Boolean) || [];
  }, [searchParams]);

  // Fetch available values. Skipped when the server already handed them over.
  useEffect(() => {
    if (initialValues) return;

    async function fetchValues() {
      try {
        const response = await fetch('/api/products/values');
        if (response.ok) {
          const data = await response.json();
          // Handle both wrapped response { data: [...] } and direct array
          const valuesArray = Array.isArray(data) ? data : (data.data || []);
          setValues(valuesArray);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch product values:', error);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchValues();
  }, [initialValues]);

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
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="size-4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
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
      {/* Header with optional collapse. The toggle is its own <button> so
          the Clear button is not nested inside another interactive control. */}
      <div className="mb-4 flex items-center justify-between gap-2">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex flex-1 items-center justify-between gap-2 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <svg aria-hidden="true"
              className={cn(
                'size-4 text-muted-foreground transition-transform',
                expanded && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        )}
        {selectedValues.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Clear
          </button>
        )}
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
                  'flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors',
                  hasProducts
                    ? 'hover:bg-muted/50'
                    : 'cursor-not-allowed opacity-50',
                  isSelected && 'bg-primary/10'
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => hasProducts && toggleValue(value.slug)}
                  disabled={!hasProducts}
                  className={cn(
                    'size-4 rounded border-border',
                    'focus-visible:ring-ring focus-visible:ring-offset-0',
                    'text-primary',
                    !hasProducts && 'cursor-not-allowed'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-sm',
                      isSelected ? 'font-medium text-foreground' : 'text-foreground'
                    )}>
                      {value.name}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {value.productCount}
                    </span>
                  </div>
                  {value.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
