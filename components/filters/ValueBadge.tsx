'use client';

import { cn } from '@/lib/utils';

interface ProductValue {
  id: string;
  name: string;
  slug: string;
  iconName?: string | null;
}

interface ValueBadgeProps {
  value: ProductValue;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
  showIcon?: boolean;
  className?: string;
}

// Map of value slugs to their corresponding icon and color
const valueStyles: Record<string, { color: string; bgColor: string }> = {
  'zero-waste': { color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  'plastic-free': { color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  'vegan': { color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  'cruelty-free': { color: 'text-pink-700', bgColor: 'bg-pink-50 border-pink-200' },
  'women-owned': { color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  'black-owned': { color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  'small-business': { color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
  'made-in-usa': { color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  'organic': { color: 'text-lime-700', bgColor: 'bg-lime-50 border-lime-200' },
  'fair-trade': { color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  'biodegradable': { color: 'text-teal-700', bgColor: 'bg-teal-50 border-teal-200' },
  'recyclable': { color: 'text-cyan-700', bgColor: 'bg-cyan-50 border-cyan-200' },
};

// Value icons using SVG paths
const valueIcons: Record<string, React.ReactNode> = {
  'zero-waste': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93l14.14 14.14" />
    </svg>
  ),
  'plastic-free': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  'vegan': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a4 4 0 014 4c0 .53-.104 1.036-.293 1.5H12v4.5l-2.5 4 2.5 4.5H8c-1.5 0-4-2-4-4.5s1.5-5 4-6c0-1.5.5-3 2-4s3.5-1.5 6-2l.293-.5A4 4 0 0112 2z" />
    </svg>
  ),
  'cruelty-free': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  'women-owned': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="5" />
      <path d="M12 13v8" />
      <path d="M9 18h6" />
    </svg>
  ),
  'black-owned': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  ),
  'small-business': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  'made-in-usa': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  'organic': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22c5-4.5 7-9 4-13-3-4-8-3-10 1-1 2.5.5 5 3 6.5" />
      <path d="M12 22V8" />
    </svg>
  ),
  'fair-trade': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'biodegradable': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  'recyclable': (
    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 16l-4-4m0 0l4-4m-4 4h18" />
      <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
};

const defaultIcon = (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export function ValueBadge({
  value,
  size = 'sm',
  variant = 'default',
  showIcon = true,
  className,
}: ValueBadgeProps) {
  const style = valueStyles[value.slug] || { color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' };
  const icon = valueIcons[value.slug] || defaultIcon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border font-medium',
        style.bgColor,
        style.color,
        sizeClasses[size],
        variant === 'outline' && 'bg-transparent',
        className
      )}
      title={value.name}
    >
      {showIcon && <span className="shrink-0">{icon}</span>}
      <span>{value.name}</span>
    </span>
  );
}

interface ValueBadgeListProps {
  values: ProductValue[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ValueBadgeList({
  values,
  maxDisplay = 3,
  size = 'sm',
  className,
}: ValueBadgeListProps) {
  if (!values || values.length === 0) return null;

  const displayedValues = values.slice(0, maxDisplay);
  const remainingCount = values.length - maxDisplay;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {displayedValues.map((value) => (
        <ValueBadge key={value.id} value={value} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className={cn(
          'inline-flex items-center rounded-full border border-gray-200 bg-gray-50 font-medium text-gray-600',
          size === 'sm' && 'px-2 py-0.5 text-xs',
          size === 'md' && 'px-2.5 py-1 text-sm',
          size === 'lg' && 'px-3 py-1.5 text-sm',
        )}>
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}
