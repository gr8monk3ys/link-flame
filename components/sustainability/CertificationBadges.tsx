"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface Certification {
  id: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  verificationUrl?: string | null;
}

interface CertificationBadgesProps {
  certifications: Certification[];
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  maxDisplay?: number;
  className?: string;
}

// Certification icon fallbacks when no iconUrl is provided
const certificationIcons: Record<string, React.ReactNode> = {
  "1% for the Planet": (
    <svg className="size-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M8 8l8 8M16 8l-8 8" />
    </svg>
  ),
  "B Corp Certified": (
    <svg className="size-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 7h4a2 2 0 110 4H8V7zM8 11h5a2 2 0 110 4H8v-4z" />
    </svg>
  ),
  "Climate Neutral": (
    <svg className="size-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  "Plastic Free": (
    <svg className="size-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M4 4l16 16" />
      <path d="M9 7h6l-1 10H10L9 7z" />
    </svg>
  ),
  "Vegan": (
    <svg className="size-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" />
      <path d="M22 2L12 12" />
      <path d="M12 22V12" />
      <path d="M18 6c-3 0-6 3-6 6" />
    </svg>
  ),
  "Cruelty Free": (
    <svg className="size-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  "USDA Organic": (
    <svg className="size-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8M12 8v8" />
      <path d="M8 8l8 8M16 8l-8 8" />
    </svg>
  ),
};

// Colors for different certifications
const certificationColors: Record<string, string> = {
  "1% for the Planet": "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  "B Corp Certified": "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Climate Neutral": "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300",
  "Plastic Free": "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  "Vegan": "bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300",
  "Cruelty Free": "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300",
  "USDA Organic": "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const badgeSizeClasses = {
  sm: "px-1.5 py-0.5 text-xs gap-1",
  md: "px-2 py-1 text-sm gap-1.5",
  lg: "px-2.5 py-1 text-base gap-2",
};

const iconContainerSizeClasses = {
  sm: "w-6 h-6 p-1",
  md: "w-7 h-7 p-1",
  lg: "w-8 h-8 p-1.5",
};

export function CertificationBadges({
  certifications,
  size = "md",
  showLabels = false,
  maxDisplay = 5,
  className,
}: CertificationBadgesProps) {
  if (!certifications || certifications.length === 0) {
    return null;
  }

  const displayedCerts = certifications.slice(0, maxDisplay);
  const remainingCount = certifications.length - maxDisplay;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {displayedCerts.map((cert) => (
        showLabels ? (
          <Badge
            key={cert.id}
            variant="outline"
            className={cn(
              "flex cursor-default items-center transition-colors",
              badgeSizeClasses[size],
              certificationColors[cert.name] || "border-gray-200 bg-gray-100 text-gray-800"
            )}
            title={cert.description || cert.name}
          >
            <span className={sizeClasses[size]}>
              {cert.iconUrl ? (
                <Image
                  src={cert.iconUrl}
                  alt={cert.name}
                  width={24}
                  height={24}
                  className="size-full object-contain"
                />
              ) : (
                certificationIcons[cert.name] || (
                  <svg className="size-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                )
              )}
            </span>
            <span className="font-medium">{cert.name}</span>
          </Badge>
        ) : (
          <div
            key={cert.id}
            className={cn(
              "flex cursor-default items-center justify-center rounded-full border transition-colors",
              iconContainerSizeClasses[size],
              certificationColors[cert.name] || "border-gray-200 bg-gray-100 text-gray-800"
            )}
            role="img"
            aria-label={cert.name}
            title={cert.description ? `${cert.name}: ${cert.description}` : cert.name}
          >
            {cert.iconUrl ? (
              <Image
                src={cert.iconUrl}
                alt={cert.name}
                width={24}
                height={24}
                className="size-full object-contain"
              />
            ) : (
              <span className={sizeClasses[size]}>
                {certificationIcons[cert.name] || (
                  <svg className="size-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                )}
              </span>
            )}
          </div>
        )
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="secondary"
          className={cn(
            "cursor-default",
            badgeSizeClasses[size]
          )}
          title={`${remainingCount} more certifications`}
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

// Compact version for product cards
export function CertificationBadgesCompact({
  certifications,
  className,
}: {
  certifications: Certification[];
  className?: string;
}) {
  return (
    <CertificationBadges
      certifications={certifications}
      size="sm"
      showLabels={false}
      maxDisplay={4}
      className={className}
    />
  );
}

// Full version with labels for product detail pages
export function CertificationBadgesFull({
  certifications,
  className,
}: {
  certifications: Certification[];
  className?: string;
}) {
  return (
    <CertificationBadges
      certifications={certifications}
      size="md"
      showLabels={true}
      maxDisplay={10}
      className={className}
    />
  );
}
