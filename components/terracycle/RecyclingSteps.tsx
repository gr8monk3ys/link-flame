"use client";

import { cn } from "@/lib/utils";

interface RecyclingStepsProps {
  className?: string;
}

// Package/Box icon
const PackageIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

// Truck/Shipping icon
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

// Gift/Reward icon
const GiftIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </svg>
);

const steps = [
  {
    number: 1,
    icon: PackageIcon,
    title: "Collect Your Empties",
    description:
      "Save your empty product packaging from Link Flame purchases. This includes bottles, tubes, jars, pumps, and caps from our sustainable products.",
    tip: "Keep a small bin in your bathroom or kitchen to collect empties",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/50",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    number: 2,
    icon: TruckIcon,
    title: "Ship for Free",
    description:
      "Once you have collected enough empties, request a free prepaid shipping label from our TerraCycle program page. Pack your items and drop off at any shipping location.",
    tip: "No minimum required, but we recommend waiting until you have 10+ items",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/50",
    borderColor: "border-teal-200 dark:border-teal-800",
  },
  {
    number: 3,
    icon: RecycleIcon,
    title: "Recycled & Upcycled",
    description:
      "TerraCycle receives your packaging and sorts it by material type. Items are then cleaned and processed to be recycled into new raw materials or upcycled into new products.",
    tip: "Your packaging could become playground equipment, park benches, or new containers",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/50",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  {
    number: 4,
    icon: GiftIcon,
    title: "Earn Rewards",
    description:
      "Track your recycling impact in your account dashboard. Earn loyalty points for each shipment, plus exclusive discounts and early access to new sustainable products.",
    tip: "Every shipment earns you 50 loyalty points toward your next purchase",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/50",
    borderColor: "border-green-200 dark:border-green-800",
  },
];

export function RecyclingSteps({ className }: RecyclingStepsProps) {
  return (
    <section id="how-it-works" className={cn("py-20", className)}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Recycling your product packaging is easy with our TerraCycle partnership.
            Follow these simple steps to give your empties a second life.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Connection Line (hidden on mobile) */}
          <div className="absolute inset-x-0 top-1/2 z-0 hidden h-0.5 -translate-y-1/2 bg-gradient-to-r from-emerald-200 via-teal-200 to-green-200 dark:from-emerald-800 dark:via-teal-800 dark:to-green-800 lg:block" />

          <div className="relative z-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className={cn(
                  "relative rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:bg-gray-900",
                  step.borderColor
                )}
              >
                {/* Step Number Badge */}
                <div
                  className={cn(
                    "absolute -top-4 left-6 flex size-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-md",
                    step.bgColor.replace("100", "600").replace("900/50", "500")
                  )}
                  style={{
                    backgroundColor:
                      step.number === 1
                        ? "#059669"
                        : step.number === 2
                        ? "#0d9488"
                        : step.number === 3
                        ? "#0891b2"
                        : "#16a34a",
                  }}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    "mb-4 mt-2 inline-flex size-14 items-center justify-center rounded-xl",
                    step.bgColor
                  )}
                >
                  <step.icon className={cn("size-7", step.color)} />
                </div>

                {/* Content */}
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {step.description}
                </p>

                {/* Tip Box */}
                <div
                  className={cn(
                    "rounded-lg p-3 text-xs",
                    step.bgColor
                  )}
                >
                  <span className={cn("font-semibold", step.color)}>Tip:</span>{" "}
                  <span className="text-gray-700 dark:text-gray-300">{step.tip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
