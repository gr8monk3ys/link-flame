'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ImperfectBannerProps {
  variant?: 'full' | 'compact' | 'hero';
  className?: string;
  showCTA?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

/**
 * ImperfectBanner - Promotional banner for the "Perfectly Imperfect" collection
 * Emphasizes waste reduction and sustainability while highlighting savings
 */
export function ImperfectBanner({
  variant = 'full',
  className,
  showCTA = true,
  ctaText = 'Shop Perfectly Imperfect',
  ctaLink = '/imperfect',
}: ImperfectBannerProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <LeafIcon className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-900">Perfectly Imperfect Deals</p>
              <p className="text-sm text-amber-700">Up to 47% off on items that reduce waste</p>
            </div>
          </div>
          {showCTA && (
            <Link
              href={ctaLink}
              className="inline-flex shrink-0 items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <section
        className={cn(
          'relative overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100',
          className
        )}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="size-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="leaf-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path
                  d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
                  fill="currentColor"
                  className="text-amber-800"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#leaf-pattern)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-amber-800 backdrop-blur-sm">
              <LeafIcon className="size-4" />
              Reduce Waste, Save More
            </span>

            <h1 className="text-4xl font-bold tracking-tight text-amber-900 sm:text-5xl lg:text-6xl">
              Perfectly Imperfect
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-amber-800">
              Same great products, just not picture-perfect. Give these items a second chance
              and save up to <span className="font-bold">47%</span> while reducing waste.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {showCTA && (
                <Link
                  href={ctaLink}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-8 py-4 font-semibold text-white shadow-lg shadow-amber-600/20 transition-colors hover:bg-amber-700"
                >
                  <ShoppingBagIcon className="size-5" />
                  {ctaText}
                </Link>
              )}
              <Link
                href="/imperfect#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl bg-white/80 px-8 py-4 font-semibold text-amber-800 backdrop-blur-sm transition-colors hover:bg-white"
              >
                Learn More
                <ArrowRightIcon className="size-5" />
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/60 p-6 backdrop-blur-sm">
                <p className="text-3xl font-bold text-amber-900">47%</p>
                <p className="mt-1 text-sm text-amber-700">Average Savings</p>
              </div>
              <div className="rounded-2xl bg-white/60 p-6 backdrop-blur-sm">
                <p className="text-3xl font-bold text-amber-900">100%</p>
                <p className="mt-1 text-sm text-amber-700">Same Quality</p>
              </div>
              <div className="rounded-2xl bg-white/60 p-6 backdrop-blur-sm">
                <p className="text-3xl font-bold text-amber-900">Zero</p>
                <p className="mt-1 text-sm text-amber-700">Waste Created</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Full variant (default)
  return (
    <div
      className={cn(
        'rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 p-8 lg:p-12',
        className
      )}
    >
      <div className="flex flex-col items-center gap-8 lg:flex-row">
        <div className="shrink-0">
          <div className="flex size-24 items-center justify-center rounded-full bg-amber-200">
            <LeafIcon className="size-12 text-amber-700" />
          </div>
        </div>

        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-2xl font-bold text-amber-900 lg:text-3xl">
            Perfectly Imperfect Collection
          </h2>
          <p className="mt-3 max-w-2xl text-amber-800">
            These products have minor cosmetic imperfections but work just as well.
            By choosing imperfect items, you help reduce waste and get amazing deals
            with savings up to <span className="font-semibold">47% off</span>.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <CheckCircleIcon className="size-5 text-amber-600" />
              <span>Same quality guaranteed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <CheckCircleIcon className="size-5 text-amber-600" />
              <span>Reduces landfill waste</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <CheckCircleIcon className="size-5 text-amber-600" />
              <span>Full warranty included</span>
            </div>
          </div>
        </div>

        {showCTA && (
          <div className="shrink-0">
            <Link
              href={ctaLink}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-700"
            >
              {ctaText}
              <ArrowRightIcon className="size-5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Icon components
function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

export default ImperfectBanner;
