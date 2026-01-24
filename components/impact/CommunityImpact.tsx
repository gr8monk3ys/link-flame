"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Droplet,
  Leaf,
  Recycle,
  TreeDeciduous,
  Trash2,
  Wine,
  LucideIcon,
  Loader2,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Icon mapping for impact metrics
const ICON_MAP: Record<string, LucideIcon> = {
  bottle: Wine,
  droplet: Droplet,
  leaf: Leaf,
  tree: TreeDeciduous,
  recycle: Recycle,
  trash: Trash2,
};

interface CommunityMetric {
  metricId: string;
  name: string;
  slug: string;
  unit: string;
  iconName: string;
  description: string | null;
  totalValue: number;
  contributorCount: number;
  comparison: string | null;
}

interface CommunityImpactProps {
  className?: string;
  showHeader?: boolean;
  maxMetrics?: number;
}

export function CommunityImpact({
  className,
  showHeader = true,
  maxMetrics = 6,
}: CommunityImpactProps) {
  const [metrics, setMetrics] = useState<CommunityMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommunityImpact() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/impact/community");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to fetch community impact");
        }

        setMetrics(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCommunityImpact();
  }, []);

  const formatValue = (val: number): string => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    if (val >= 1) {
      return Math.round(val).toString();
    }
    return val.toFixed(1);
  };

  const totalContributors = Math.max(
    ...metrics.map((m) => m.contributorCount),
    0
  );

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || metrics.length === 0) {
    return null; // Silently hide if no community data
  }

  const displayMetrics = metrics
    .filter((m) => m.totalValue > 0)
    .slice(0, maxMetrics);

  if (displayMetrics.length === 0) {
    return null;
  }

  return (
    <section className={cn("", className)}>
      {showHeader && (
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold">
            Our Community&apos;s Impact
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Together, our community is making a real difference for the planet.
            Every sustainable purchase adds up to meaningful change.
          </p>
          {totalContributors > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
              <Users className="size-5" />
              <span className="font-medium">
                {totalContributors.toLocaleString()} eco-conscious shoppers
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {displayMetrics.map((metric) => {
          const Icon = ICON_MAP[metric.iconName] || Leaf;

          return (
            <Card
              key={metric.metricId}
              className="text-center transition-shadow hover:shadow-md"
            >
              <CardContent className="pb-4 pt-6">
                <div className="mb-3 flex justify-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Icon className="size-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatValue(metric.totalValue)}
                </div>
                <div className="mb-1 text-sm text-muted-foreground">
                  {metric.unit}
                </div>
                <div className="text-xs font-medium">{metric.name}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
