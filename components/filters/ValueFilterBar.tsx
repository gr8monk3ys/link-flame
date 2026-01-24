'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
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

interface ValueFilterBarProps {
  className?: string;
}

// Value icons using SVG paths (same as ValueBadge)
const valueIcons: Record<string, React.ReactNode> = {
  'zero-waste': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93l14.14 14.14" />
    </svg>
  ),
  'plastic-free': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  'vegan': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a4 4 0 014 4c0 .53-.104 1.036-.293 1.5H12v4.5l-2.5 4 2.5 4.5H8c-1.5 0-4-2-4-4.5s1.5-5 4-6c0-1.5.5-3 2-4s3.5-1.5 6-2l.293-.5A4 4 0 0112 2z" />
    </svg>
  ),
  'cruelty-free': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  'women-owned': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="5" />
      <path d="M12 13v8" />
      <path d="M9 18h6" />
    </svg>
  ),
  'black-owned': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  ),
  'small-business': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  'made-in-usa': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  'organic': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22c5-4.5 7-9 4-13-3-4-8-3-10 1-1 2.5.5 5 3 6.5" />
      <path d="M12 22V8" />
    </svg>
  ),
  'fair-trade': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'biodegradable': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  'recyclable': (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 16l-4-4m0 0l4-4m-4 4h18" />
      <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
};

const defaultIcon = (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export function ValueFilterBar({ className }: ValueFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [values, setValues] = useState<ProductValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

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

  // Check scroll position for gradient indicators
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();
    container.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition, values]);

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

  if (loading) {
    return (
      <div className={cn('flex gap-2 overflow-hidden', className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (values.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Left scroll indicator */}
      {showLeftScroll && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex gap-2 overflow-x-auto px-0.5 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {values.map((value) => {
          const isSelected = selectedValues.includes(value.slug);
          const icon = valueIcons[value.slug] || defaultIcon;

          return (
            <button
              key={value.id}
              onClick={() => toggleValue(value.slug)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                'shrink-0 whitespace-nowrap border',
                'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                isSelected
                  ? 'border-green-600 bg-green-600 text-white hover:bg-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
              )}
              aria-pressed={isSelected}
              title={value.description || value.name}
            >
              <span className="shrink-0">{icon}</span>
              <span>{value.name}</span>
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
              )}>
                {value.productCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right scroll indicator */}
      {showRightScroll && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />
      )}
    </div>
  );
}
