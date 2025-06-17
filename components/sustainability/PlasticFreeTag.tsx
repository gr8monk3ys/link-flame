"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PlasticFreeTagProps {
  variant?: "badge" | "label" | "icon" | "corner";
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Recycle/No-plastic icon
const PlasticFreeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M4 4l16 16" />
    <path d="M9 7h6l-1 10H10L9 7z" />
  </svg>
);

// Leaf icon
const LeafIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const sizeConfig = {
  sm: {
    badge: "px-1.5 py-0.5 text-xs gap-1",
    icon: "h-3 w-3",
    label: "text-xs gap-1",
    corner: "w-16 h-16 text-[8px]",
  },
  md: {
    badge: "px-2 py-1 text-xs gap-1.5",
    icon: "h-4 w-4",
    label: "text-sm gap-1.5",
    corner: "w-20 h-20 text-[10px]",
  },
  lg: {
    badge: "px-2.5 py-1.5 text-sm gap-2",
    icon: "h-5 w-5",
    label: "text-base gap-2",
    corner: "w-24 h-24 text-xs",
  },
};

export function PlasticFreeTag({
  variant = "badge",
  size = "md",
  className,
}: PlasticFreeTagProps) {
  const config = sizeConfig[size];

  if (variant === "icon") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-green-100 p-1 dark:bg-green-900/50",
          className
        )}
        title="Plastic-Free Product"
        role="img"
        aria-label="Plastic-Free"
      >
        <PlasticFreeIcon className={cn(config.icon, "text-green-600 dark:text-green-400")} />
      </div>
    );
  }

  if (variant === "label") {
    return (
      <span
        className={cn(
          "inline-flex items-center font-medium text-green-700 dark:text-green-400",
          config.label,
          className
        )}
        title="This product and its packaging are plastic-free"
      >
        <PlasticFreeIcon className={config.icon} />
        Plastic-Free
      </span>
    );
  }

  if (variant === "corner") {
    return (
      <div
        className={cn(
          "absolute -right-8 top-4 rotate-45 bg-green-600 text-center font-semibold leading-tight text-white shadow-sm",
          config.corner,
          className
        )}
        style={{ width: size === "sm" ? 80 : size === "md" ? 100 : 120 }}
        title="Plastic-Free Product"
      >
        <div className="flex h-6 items-center justify-center">
          <LeafIcon className="mr-0.5 size-3" />
          <span>Plastic-Free</span>
        </div>
      </div>
    );
  }

  // Default: badge variant
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300",
        "inline-flex items-center font-medium",
        config.badge,
        className
      )}
      title="This product and its packaging are plastic-free"
    >
      <PlasticFreeIcon className={config.icon} />
      Plastic-Free
    </Badge>
  );
}

// Quick sustainability tags for product cards
export function SustainabilityTags({
  isPlasticFree = false,
  isVegan = false,
  isCrueltyFree = false,
  isOrganicCertified = false,
  size = "sm",
  maxTags = 3,
  className,
}: {
  isPlasticFree?: boolean;
  isVegan?: boolean;
  isCrueltyFree?: boolean;
  isOrganicCertified?: boolean;
  size?: "sm" | "md" | "lg";
  maxTags?: number;
  className?: string;
}) {
  const tags: { label: string; icon: React.ReactNode; color: string }[] = [];

  if (isPlasticFree) {
    tags.push({
      label: "Plastic-Free",
      icon: <PlasticFreeIcon className={sizeConfig[size].icon} />,
      color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    });
  }
  if (isVegan) {
    tags.push({
      label: "Vegan",
      icon: <LeafIcon className={sizeConfig[size].icon} />,
      color: "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300",
    });
  }
  if (isCrueltyFree) {
    tags.push({
      label: "Cruelty-Free",
      icon: (
        <svg className={sizeConfig[size].icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      ),
      color: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300",
    });
  }
  if (isOrganicCertified) {
    tags.push({
      label: "Organic",
      icon: (
        <svg className={sizeConfig[size].icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    });
  }

  if (tags.length === 0) return null;

  const displayTags = tags.slice(0, maxTags);
  const remaining = tags.length - maxTags;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {displayTags.map((tag) => (
        <Badge
          key={tag.label}
          variant="outline"
          className={cn(
            "inline-flex items-center font-medium",
            sizeConfig[size].badge,
            tag.color
          )}
        >
          {tag.icon}
          {tag.label}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="secondary" className={sizeConfig[size].badge}>
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
