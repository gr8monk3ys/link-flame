"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface SustainabilityCommitmentProps {
  variant?: "default" | "compact" | "footer";
  className?: string;
}

// Leaf icon
const LeafIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

// Earth/Globe icon
const GlobeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// Recycle icon
const RecycleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
    <path d="m14 16-3 3 3 3" />
    <path d="M8.293 13.596 4.875 8.5l1.753-3" />
  </svg>
);

// Heart icon
const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

// Truck icon
const TruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </svg>
);

const commitments = [
  {
    icon: GlobeIcon,
    title: "1% for the Planet",
    description: "We donate 1% of annual sales to environmental nonprofits",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/50",
  },
  {
    icon: TruckIcon,
    title: "Carbon-Neutral Shipping",
    description: "All orders ship with fully offset carbon emissions",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/50",
  },
  {
    icon: RecycleIcon,
    title: "Plastic-Free Packaging",
    description: "We ship using only recyclable and compostable materials",
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/50",
  },
  {
    icon: HeartIcon,
    title: "Ethical Sourcing",
    description: "We partner only with suppliers who share our values",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/50",
  },
];

export function SustainabilityCommitment({
  variant = "default",
  className,
}: SustainabilityCommitmentProps) {
  if (variant === "footer") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <LeafIcon className="size-5 text-green-600 dark:text-green-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Our Commitment</h3>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-green-500" />
            1% for the Planet member
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-green-500" />
            Carbon-neutral shipping
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-green-500" />
            Plastic-free packaging
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-green-500" />
            Ethically sourced products
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-green-500" />
            <Link
              href="/terracycle"
              className="hover:text-green-600 dark:hover:text-green-400"
            >
              TerraCycle recycling partner
            </Link>
          </li>
        </ul>
        <Link
          href="/sustainability"
          className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
        >
          Learn more
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn(
        "flex flex-wrap items-center justify-center gap-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20",
        className
      )}>
        {commitments.slice(0, 3).map((commitment) => (
          <div key={commitment.title} className="flex items-center gap-2">
            <commitment.icon className={cn("size-5", commitment.color)} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {commitment.title}
            </span>
          </div>
        ))}
        <Link
          href="/sustainability"
          className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
        >
          Learn more
        </Link>
      </div>
    );
  }

  // Default variant
  return (
    <section className={cn("py-12", className)}>
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300">
            <LeafIcon className="size-4" />
            Our Commitment to the Planet
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Sustainability at Our Core
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Every purchase you make supports our mission to protect and preserve the environment
            for future generations.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {commitments.map((commitment) => (
            <div
              key={commitment.title}
              className="group rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className={cn(
                "mb-4 inline-flex size-12 items-center justify-center rounded-lg",
                commitment.bgColor
              )}>
                <commitment.icon className={cn("size-6", commitment.color)} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {commitment.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {commitment.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/sustainability"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
          >
            Learn About Our Impact
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Horizontal banner version
export function SustainabilityBanner({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-gradient-to-r from-green-600 to-emerald-600 text-white",
      className
    )}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <LeafIcon className="size-4" />
            <span>1% for the Planet</span>
          </div>
          <div className="flex items-center gap-2">
            <TruckIcon className="size-4" />
            <span>Carbon-Neutral Shipping</span>
          </div>
          <div className="flex items-center gap-2">
            <RecycleIcon className="size-4" />
            <span>Plastic-Free Packaging</span>
          </div>
        </div>
      </div>
    </div>
  );
}
