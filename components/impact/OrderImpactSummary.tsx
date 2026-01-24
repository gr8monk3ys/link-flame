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
  Sparkles,
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

interface OrderImpactMetric {
  metricId: string;
  name: string;
  slug: string;
  unit: string;
  iconName: string;
  value: number;
  comparison: string | null;
}

interface OrderImpactSummaryProps {
  orderId: string;
  className?: string;
}

export function OrderImpactSummary({
  orderId,
  className,
}: OrderImpactSummaryProps) {
  const [metrics, setMetrics] = useState<OrderImpactMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderImpact() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/impact/order/${orderId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to fetch order impact");
        }

        setMetrics(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    if (orderId) {
      fetchOrderImpact();
    }
  }, [orderId]);

  const formatValue = (val: number): string => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    if (val >= 1) {
      return Math.round(val).toString();
    }
    return val.toFixed(1);
  };

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || metrics.length === 0) {
    return null; // Silently hide if no impact data
  }

  return (
    <Card className={cn("border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950 dark:to-emerald-950", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <Sparkles className="size-5" />
          Your Order&apos;s Impact
        </CardTitle>
        <CardDescription className="text-green-600 dark:text-green-400">
          Thank you for making an eco-friendly choice!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = ICON_MAP[metric.iconName] || Leaf;

            return (
              <div
                key={metric.metricId}
                className="rounded-xl bg-white/60 p-4 text-center dark:bg-black/20"
              >
                <div className="mb-2 flex justify-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-green-500/20">
                    <Icon className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatValue(metric.value)}
                </div>
                <div className="text-xs text-muted-foreground">{metric.unit}</div>
                <div className="mt-1 text-sm font-medium">{metric.name}</div>
              </div>
            );
          })}
        </div>

        {/* Show first comparison if available */}
        {metrics[0]?.comparison && (
          <p className="mt-4 text-center text-sm italic text-green-700 dark:text-green-300">
            {metrics[0].comparison}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
