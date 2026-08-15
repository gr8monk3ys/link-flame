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
      className={cn("border-b bg-secondary/40 py-16 lg:py-20", className)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Content */}
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Recycling program
            </p>

            <h1 className="mt-3 font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
              Send your empties back
            </h1>

            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Some packaging can&apos;t go in your curbside bin — pumps, caps,
              flexible pouches. Through TerraCycle, you can send those empties
              back to us instead, and they&apos;re recycled or upcycled into new
              products.
            </p>

            {/* Key Benefits */}
            <ul className="mt-8 space-y-3">
              {[
                "Free shipping labels for your returns",
                "Earn rewards for recycling",
                "Track what you've kept out of landfill",
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="#get-started"
                className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Get Started
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                How It Works
              </Link>
            </div>
          </div>

          {/* What you can send back */}
          <div className="relative">
            <div className="rounded-2xl border bg-card p-8 shadow-warm">
              <div className="flex items-center gap-3">
                <RecycleIcon className="size-10 text-primary" />
                <div>
                  <div className="font-serif text-xl text-foreground">
                    What you can send back
                  </div>
                  <div className="text-sm text-muted-foreground">
                    A few examples — full list below
                  </div>
                </div>
              </div>
              <ul className="mt-6 space-y-3 border-t pt-6">
                {[
                  "Pump tops and trigger sprayers",
                  "Flexible pouches and refill packs",
                  "Toothbrush heads and floss containers",
                  "Caps, lids, and dispensers",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <LeafIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
