"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface EcoImpactCardProps {
  carbonFootprintGrams?: number | null;
  isPlasticFree?: boolean;
  isVegan?: boolean;
  isCrueltyFree?: boolean;
  isOrganicCertified?: boolean;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

// Leaf icon
const LeafIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

// Recycle icon
const RecycleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
    <path d="m14 16-3 3 3 3" />
    <path d="M8.293 13.596 4.875 8.5l1.753-3" />
    <path d="m9.5 5.5 4.5-4" />
    <path d="m10.5 14 4.5 4.5" />
  </svg>
);

// Heart icon for cruelty-free
const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

// Seedling icon for organic
const SeedlingIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22v-7" />
    <path d="M9 8a4 4 0 0 1 8 0 4 4 0 0 1-8 0Z" />
    <path d="M12 8V2" />
    <path d="M5 15h14" />
    <path d="M5 15a7 7 0 0 0 14 0" />
  </svg>
);

// CO2 icon
const CO2Icon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M8 12h.01" />
    <path d="M12 12h.01" />
    <path d="M16 12h.01" />
  </svg>
);

// Format carbon footprint for display
function formatCarbonFootprint(grams: number): { value: string; unit: string; comparison: string } {
  if (grams >= 1000) {
    return {
      value: (grams / 1000).toFixed(1),
      unit: "kg CO2e",
      comparison: getComparison(grams),
    };
  }
  return {
    value: grams.toString(),
    unit: "g CO2e",
    comparison: getComparison(grams),
  };
}

// Get a relatable comparison for carbon footprint
function getComparison(grams: number): string {
  if (grams < 100) {
    return "Less than charging your phone";
  } else if (grams < 500) {
    return "Less than a cup of coffee";
  } else if (grams < 1000) {
    return "Less than driving 1 mile";
  } else if (grams < 5000) {
    return "Less than a cheeseburger";
  } else {
    return "Offset with every purchase";
  }
}

// Calculate eco score (0-100)
function calculateEcoScore(
  carbonGrams: number | null | undefined,
  isPlasticFree: boolean,
  isVegan: boolean,
  isCrueltyFree: boolean,
  isOrganicCertified: boolean
): number {
  let score = 50; // Base score

  // Carbon footprint impact (up to 30 points)
  if (carbonGrams !== null && carbonGrams !== undefined) {
    if (carbonGrams < 100) score += 30;
    else if (carbonGrams < 500) score += 20;
    else if (carbonGrams < 1000) score += 10;
  }

  // Boolean flags (5 points each)
  if (isPlasticFree) score += 5;
  if (isVegan) score += 5;
  if (isCrueltyFree) score += 5;
  if (isOrganicCertified) score += 5;

  return Math.min(score, 100);
}

// Get score color
function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-lime-600 dark:text-lime-400";
  if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
  return "text-orange-600 dark:text-orange-400";
}

export function EcoImpactCard({
  carbonFootprintGrams,
  isPlasticFree = false,
  isVegan = false,
  isCrueltyFree = false,
  isOrganicCertified = false,
  variant = "default",
  className,
}: EcoImpactCardProps) {
  const hasAnyData = carbonFootprintGrams !== null || isPlasticFree || isVegan || isCrueltyFree || isOrganicCertified;

  if (!hasAnyData) {
    return null;
  }

  const ecoScore = calculateEcoScore(carbonFootprintGrams, isPlasticFree, isVegan, isCrueltyFree, isOrganicCertified);
  const carbonData = carbonFootprintGrams ? formatCarbonFootprint(carbonFootprintGrams) : null;

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {isPlasticFree && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300">
            <RecycleIcon className="mr-1 h-3 w-3" />
            Plastic-Free
          </Badge>
        )}
        {isVegan && (
          <Badge variant="outline" className="bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300">
            <LeafIcon className="mr-1 h-3 w-3" />
            Vegan
          </Badge>
        )}
        {isCrueltyFree && (
          <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300">
            <HeartIcon className="mr-1 h-3 w-3" />
            Cruelty-Free
          </Badge>
        )}
        {isOrganicCertified && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
            <SeedlingIcon className="mr-1 h-3 w-3" />
            Organic
          </Badge>
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn(
        "rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 p-5 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800",
        className
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Environmental Impact</h3>
          <div className="flex items-center gap-2">
            <span className={cn("text-2xl font-bold", getScoreColor(ecoScore))}>{ecoScore}</span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="space-y-4">
          {carbonData && (
            <div className="flex items-start gap-3 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/50">
                <CO2Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Carbon Footprint: <span className="text-teal-600 dark:text-teal-400">{carbonData.value} {carbonData.unit}</span>
                </p>
                <p className="text-sm text-muted-foreground">{carbonData.comparison}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {isPlasticFree && (
              <div className="flex items-center gap-2 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <RecycleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Plastic-Free</p>
                  <p className="text-xs text-muted-foreground">Zero plastic packaging</p>
                </div>
              </div>
            )}
            {isVegan && (
              <div className="flex items-center gap-2 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <LeafIcon className="h-5 w-5 text-lime-600 dark:text-lime-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Vegan</p>
                  <p className="text-xs text-muted-foreground">No animal products</p>
                </div>
              </div>
            )}
            {isCrueltyFree && (
              <div className="flex items-center gap-2 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <HeartIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Cruelty-Free</p>
                  <p className="text-xs text-muted-foreground">Never tested on animals</p>
                </div>
              </div>
            )}
            {isOrganicCertified && (
              <div className="flex items-center gap-2 rounded-lg bg-white/50 p-3 dark:bg-gray-800/50">
                <SeedlingIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Certified Organic</p>
                  <p className="text-xs text-muted-foreground">USDA organic certified</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "rounded-lg border bg-green-50/50 p-4 dark:bg-green-900/10 dark:border-green-800",
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <LeafIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
        <h4 className="font-medium text-gray-900 dark:text-white">Eco Impact</h4>
        <div className="ml-auto flex items-center gap-1">
          <span className={cn("text-lg font-bold", getScoreColor(ecoScore))}>{ecoScore}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      <div className="space-y-2">
        {carbonData && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Carbon footprint</span>
            <span className="font-medium">{carbonData.value} {carbonData.unit}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {isPlasticFree && (
            <Badge variant="secondary" className="text-xs">Plastic-Free</Badge>
          )}
          {isVegan && (
            <Badge variant="secondary" className="text-xs">Vegan</Badge>
          )}
          {isCrueltyFree && (
            <Badge variant="secondary" className="text-xs">Cruelty-Free</Badge>
          )}
          {isOrganicCertified && (
            <Badge variant="secondary" className="text-xs">Organic</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple inline version for product listings
export function EcoImpactBadges({
  isPlasticFree = false,
  isVegan = false,
  isCrueltyFree = false,
  isOrganicCertified = false,
  className,
}: Omit<EcoImpactCardProps, "carbonFootprintGrams" | "variant">) {
  return (
    <EcoImpactCard
      isPlasticFree={isPlasticFree}
      isVegan={isVegan}
      isCrueltyFree={isCrueltyFree}
      isOrganicCertified={isOrganicCertified}
      variant="compact"
      className={className}
    />
  );
}
