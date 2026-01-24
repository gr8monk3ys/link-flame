"use client";

import { cn } from "@/lib/utils";

interface AcceptedItemsProps {
  className?: string;
}

// Check Circle icon
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

// X Circle icon
const XCircleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

const acceptedCategories = [
  {
    name: "Personal Care",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12h.01" />
        <path d="M15 12h.01" />
        <path d="M10 16c.5.3 1.5.5 2 .5s1.5-.2 2-.5" />
        <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
      </svg>
    ),
    items: [
      "Shampoo & conditioner bottles",
      "Body wash & soap dispensers",
      "Lotion & moisturizer tubes",
      "Deodorant containers",
      "Toothpaste tubes & pumps",
    ],
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
  {
    name: "Skincare",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12h20" />
        <path d="M10 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
        <path d="M10 8V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4" />
        <path d="M20 16v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-1" />
        <path d="M14 8V7c0-1.1.9-2 2-2h2a2 2 0 0 1 2 2v1" />
      </svg>
    ),
    items: [
      "Serum & oil dropper bottles",
      "Cream jars & pots",
      "Face wash tubes",
      "Sunscreen containers",
      "Eye cream tubes",
    ],
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    name: "Cleaning Products",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m9 11-6 6v3h9l3-3" />
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
      </svg>
    ),
    items: [
      "Dish soap bottles",
      "All-purpose cleaner sprayers",
      "Laundry detergent containers",
      "Hand soap dispensers",
      "Cleaning concentrate pouches",
    ],
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    name: "Kitchen & Food",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
        <line x1="6" x2="18" y1="17" y2="17" />
      </svg>
    ),
    items: [
      "Spice jars & lids",
      "Supplement bottles",
      "Tea & coffee packaging",
      "Snack wrappers (select brands)",
      "Food storage container lids",
    ],
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    name: "Beauty & Makeup",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
        <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
      </svg>
    ),
    items: [
      "Mascara tubes",
      "Lipstick containers",
      "Foundation bottles",
      "Compact cases",
      "Makeup brush handles",
    ],
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
  {
    name: "Home & Garden",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    items: [
      "Plant food containers",
      "Seed packets",
      "Garden tool packaging",
      "Air freshener containers",
      "Candle jars (wax removed)",
    ],
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
];

const notAccepted = [
  "Items with hazardous residue",
  "Pressurized aerosol cans",
  "Broken glass",
  "Items contaminated with food waste",
  "Non-Link Flame branded products",
  "Medical or pharmaceutical packaging",
];

export function AcceptedItems({ className }: AcceptedItemsProps) {
  return (
    <section className={cn("bg-gray-50 py-20 dark:bg-gray-900/50", className)}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            What You Can Recycle
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Our TerraCycle program accepts a wide range of product packaging.
            Here is what you can send in for recycling.
          </p>
        </div>

        {/* Accepted Items Grid */}
        <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {acceptedCategories.map((category) => (
            <div
              key={category.name}
              className="rounded-xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              {/* Category Header */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-lg",
                    category.bgColor
                  )}
                >
                  <span className={category.color}>{category.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {category.name}
                </h3>
              </div>

              {/* Items List */}
              <ul className="space-y-2">
                {category.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Not Accepted Section */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <div className="mb-4 flex items-center gap-3">
              <XCircleIcon className="size-6 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                Not Accepted
              </h3>
            </div>
            <p className="mb-4 text-sm text-red-700 dark:text-red-300">
              For safety and processing reasons, the following items cannot be included
              in your TerraCycle shipment:
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {notAccepted.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red-500" />
                  <span className="text-red-700 dark:text-red-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
