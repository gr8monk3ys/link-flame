"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface CarbonNeutralBannerProps {
  variant?: "default" | "compact" | "minimal";
  showLearnMore?: boolean;
  className?: string;
}

// Leaf icon for sustainability
const LeafIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

// Truck icon for shipping
const TruckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </svg>
);

// Check circle icon
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export function CarbonNeutralBanner({
  variant = "default",
  showLearnMore = true,
  className,
}: CarbonNeutralBannerProps) {
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-green-700 dark:text-green-400",
          className
        )}
      >
        <LeafIcon className="h-4 w-4" />
        <span>Carbon-neutral shipping</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300",
          className
        )}
      >
        <LeafIcon className="h-4 w-4 shrink-0" />
        <span className="font-medium">Carbon-neutral shipping on all orders</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-800/50">
          <LeafIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Carbon-Neutral Shipping
            </h3>
            <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            Every order ships with fully offset carbon emissions. We partner with verified
            environmental projects to neutralize our shipping footprint.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <TruckIcon className="h-4 w-4" />
              <span>Offset on every shipment</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Verified carbon credits</span>
            </div>
            {showLearnMore && (
              <Link
                href="/sustainability"
                className="text-xs font-medium text-green-700 underline-offset-4 hover:underline dark:text-green-300"
              >
                Learn more about our commitment
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline version for cart/checkout summary
export function CarbonNeutralShippingLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
        <LeafIcon className="h-4 w-4" />
        <span>Carbon offset</span>
      </div>
      <span className="font-medium text-green-700 dark:text-green-400">Included</span>
    </div>
  );
}

// Badge version for product cards
export function CarbonNeutralBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300",
        className
      )}
      title="This order ships carbon-neutral"
    >
      <LeafIcon className="h-3 w-3" />
      <span>Carbon Neutral</span>
    </div>
  );
}
