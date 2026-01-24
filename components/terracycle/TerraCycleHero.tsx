"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface TerraCycleHeroProps {
  className?: string;
}

// Recycle icon
const RecycleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
    <path d="m14 16-3 3 3 3" />
    <path d="M8.293 13.596 4.875 8.5l1.753-3" />
    <path d="m9.5 5.5 1.753-3L14.5 5" />
    <path d="m15.5 8.5 4.2 7.28" />
  </svg>
);

// Leaf icon
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

// Check icon
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function TerraCycleHero({ className }: TerraCycleHeroProps) {
  return (
    <section
      className={cn(
        "relative bg-gradient-to-b from-emerald-50 to-white py-20 dark:from-emerald-900/20 dark:to-background lg:py-28",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Content */}
          <div className="mx-auto max-w-xl lg:mx-0">
            {/* Partnership Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
              <RecycleIcon className="size-4" />
              Official Partner
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              TerraCycle{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                Recycling Program
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              We have partnered with TerraCycle to give your empty product packaging a
              second life. Instead of ending up in landfills, your empties are recycled
              and upcycled into new products.
            </p>

            {/* Key Benefits */}
            <ul className="mt-8 space-y-3">
              {[
                "Free shipping labels for your returns",
                "Earn rewards for recycling",
                "Track your environmental impact",
                "100% of items recycled or upcycled",
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckIcon className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="#get-started"
                className="inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                Get Started
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                How It Works
              </Link>
            </div>
          </div>

          {/* Visual Element / Partnership Badge */}
          <div className="relative mx-auto lg:mx-0">
            <div className="relative rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 shadow-xl">
              <div className="absolute -right-4 -top-4 flex size-20 items-center justify-center rounded-full bg-white shadow-lg dark:bg-gray-900">
                <LeafIcon className="size-10 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div className="text-white">
                <div className="mb-6 flex items-center gap-3">
                  <RecycleIcon className="size-12" />
                  <div>
                    <div className="text-2xl font-bold">TerraCycle</div>
                    <div className="text-emerald-100">Certified Partner</div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-emerald-400/30 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-100">Items Recycled</span>
                    <span className="text-2xl font-bold">15,000+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-100">Waste Diverted</span>
                    <span className="text-2xl font-bold">2,500 kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-100">Active Participants</span>
                    <span className="text-2xl font-bold">3,200+</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-6 -left-6 size-24 rounded-full bg-emerald-200/50 blur-xl dark:bg-emerald-800/30" />
            <div className="absolute -right-6 -top-6 size-32 rounded-full bg-teal-200/50 blur-xl dark:bg-teal-800/30" />
          </div>
        </div>
      </div>
    </section>
  );
}
