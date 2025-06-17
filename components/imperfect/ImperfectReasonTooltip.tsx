'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// Common imperfect reasons with detailed explanations
const IMPERFECT_REASON_DETAILS: Record<string, { label: string; description: string; icon: string }> = {
  'dented_packaging': {
    label: 'Slightly dented packaging',
    description: 'The outer packaging has minor cosmetic dents from storage or shipping. The product inside is completely unaffected and works perfectly.',
    icon: 'box',
  },
  'label_error': {
    label: 'Label printing error',
    description: 'There is a small printing imperfection on the product label. This is purely cosmetic and does not affect the product quality.',
    icon: 'tag',
  },
  'short_expiry': {
    label: 'Short expiry date',
    description: 'This product is approaching its best-by date but is still fresh and safe to use. Perfect if you plan to use it soon!',
    icon: 'calendar',
  },
  'cosmetic_imperfection': {
    label: 'Cosmetic imperfection',
    description: 'There is a minor visual blemish on the product or packaging that does not affect its performance or quality.',
    icon: 'eye',
  },
  'previous_season': {
    label: 'Previous season packaging',
    description: 'This product has older packaging design. The formula and quality inside is exactly the same as the current version.',
    icon: 'refresh',
  },
  'overstock': {
    label: 'Overstock clearance',
    description: 'We ordered more than we needed! The product is perfect in every way - we just need to make room for new inventory.',
    icon: 'stack',
  },
  'sample_stock': {
    label: 'Sample/display stock',
    description: 'This item was previously used as a display or sample. It may have been opened but is still in like-new condition.',
    icon: 'store',
  },
  'minor_damage': {
    label: 'Minor outer box damage',
    description: 'The shipping box has cosmetic damage but the product inside is fully protected and in perfect condition.',
    icon: 'package',
  },
};

interface ImperfectReasonTooltipProps {
  reason: string;
  reasonLabel?: string;
  reasonDescription?: string;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * ImperfectReasonTooltip - Displays the reason an item is marked as imperfect with a helpful tooltip
 * Helps customers understand exactly what "imperfect" means for this specific product
 */
export function ImperfectReasonTooltip({
  reason,
  reasonLabel,
  reasonDescription,
  className,
  position = 'top',
}: ImperfectReasonTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Find matching reason details or use provided values
  const reasonKey = reason.toLowerCase().replace(/\s+/g, '_');
  const details = IMPERFECT_REASON_DETAILS[reasonKey] || null;

  const displayLabel = reasonLabel || details?.label || reason;
  const displayDescription =
    reasonDescription ||
    details?.description ||
    "This item has minor imperfections that don't affect its quality or performance.";

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900',
  };

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {/* Trigger */}
      <button
        type="button"
        className="inline-flex cursor-help items-center gap-1.5 text-sm text-amber-700 transition-colors hover:text-amber-800"
        aria-describedby="imperfect-reason-tooltip"
      >
        <InfoIcon className="size-4" />
        <span>{displayLabel}</span>
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div
          id="imperfect-reason-tooltip"
          role="tooltip"
          className={cn(
            'absolute z-50 w-64 rounded-lg bg-gray-900 p-4 text-white shadow-xl',
            'duration-200 animate-in fade-in-0 zoom-in-95',
            positionClasses[position]
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500">
              <LeafIcon className="size-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">{displayLabel}</p>
              <p className="mt-1 text-sm text-gray-300">{displayDescription}</p>
            </div>
          </div>

          {/* Quality guarantee */}
          <div className="mt-3 border-t border-gray-700 pt-3">
            <p className="flex items-center gap-1.5 text-xs text-gray-400">
              <CheckIcon className="size-3 text-green-400" />
              Same quality guarantee as regular products
            </p>
          </div>

          {/* Arrow */}
          <div
            className={cn(
              'absolute size-0',
              'border-4 border-transparent',
              arrowClasses[position]
            )}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

interface ImperfectReasonBadgeProps {
  reason: string;
  reasonLabel?: string;
  className?: string;
}

/**
 * ImperfectReasonBadge - A simpler version that just shows the reason as a badge without tooltip
 */
export function ImperfectReasonBadge({
  reason,
  reasonLabel,
  className,
}: ImperfectReasonBadgeProps) {
  const reasonKey = reason.toLowerCase().replace(/\s+/g, '_');
  const details = IMPERFECT_REASON_DETAILS[reasonKey] || null;
  const displayLabel = reasonLabel || details?.label || reason;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700',
        className
      )}
    >
      <InfoIcon className="size-3" />
      {displayLabel}
    </span>
  );
}

// Icon components
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default ImperfectReasonTooltip;
