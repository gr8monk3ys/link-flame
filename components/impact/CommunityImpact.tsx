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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Our Community&apos;s Impact
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Together, our community is making a real difference for the planet.
            Every sustainable purchase adds up to meaningful change.
          </p>
          {totalContributors > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
              <Users className="h-5 w-5" />
              <span className="font-medium">
                {totalContributors.toLocaleString()} eco-conscious shoppers
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayMetrics.map((metric) => {
          const Icon = ICON_MAP[metric.iconName] || Leaf;

          return (
            <Card
              key={metric.metricId}
              className="text-center hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6 pb-4">
                <div className="flex justify-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatValue(metric.totalValue)}
                </div>
                <div className="text-sm text-muted-foreground mb-1">
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
