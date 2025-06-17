'use client';

import { cn } from '@/lib/utils';

interface ImperfectBadgeProps {
  discountPercent: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'prominent';
  className?: string;
  showSaveText?: boolean;
}

/**
 * ImperfectBadge - Displays a badge indicating a product is "Perfectly Imperfect" with savings
 * Frames the imperfection positively as a way to reduce waste while getting great deals
 */
export function ImperfectBadge({
  discountPercent,
  size = 'md',
  variant = 'default',
  className,
  showSaveText = true,
}: ImperfectBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const variantClasses = {
    default: 'bg-amber-100 text-amber-800 border border-amber-200',
    minimal: 'bg-amber-50 text-amber-700',
    prominent: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      aria-label={`Imperfect product - Save ${discountPercent}%`}
    >
      {/* Leaf icon to emphasize eco-friendliness */}
      <svg
        className={cn(iconSizeClasses[size], 'shrink-0')}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
      </svg>
      <span>
        {showSaveText ? (
          <>Save {discountPercent}%</>
        ) : (
          <>{discountPercent}% off</>
        )}
      </span>
    </span>
  );
}

interface ImperfectLabelProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * ImperfectLabel - A simple "Perfectly Imperfect" label without discount
 */
export function ImperfectLabel({ size = 'md', className }: ImperfectLabelProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        'border border-amber-200 bg-amber-100 text-amber-800',
        sizeClasses[size],
        className
      )}
      aria-label="Perfectly Imperfect product"
    >
      <svg
        className={cn(iconSizeClasses[size], 'shrink-0')}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
      <span>Perfectly Imperfect</span>
    </span>
  );
}

interface ImperfectSavingsBadgeProps {
  originalPrice: number;
  imperfectPrice: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * ImperfectSavingsBadge - Shows the dollar amount saved on an imperfect item
 */
export function ImperfectSavingsBadge({
  originalPrice,
  imperfectPrice,
  size = 'md',
  className,
}: ImperfectSavingsBadgeProps) {
  const savings = originalPrice - imperfectPrice;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold text-green-600',
        sizeClasses[size],
        className
      )}
      aria-label={`You save $${savings.toFixed(2)}`}
    >
      You save ${savings.toFixed(2)}
    </span>
  );
}

export default ImperfectBadge;
