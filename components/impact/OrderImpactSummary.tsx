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
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || metrics.length === 0) {
    return null; // Silently hide if no impact data
  }

  return (
    <Card className={cn("bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <Sparkles className="h-5 w-5" />
          Your Order&apos;s Impact
        </CardTitle>
        <CardDescription className="text-green-600 dark:text-green-400">
          Thank you for making an eco-friendly choice!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric) => {
            const Icon = ICON_MAP[metric.iconName] || Leaf;

            return (
              <div
                key={metric.metricId}
                className="bg-white/60 dark:bg-black/20 rounded-xl p-4 text-center"
              >
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatValue(metric.value)}
                </div>
                <div className="text-xs text-muted-foreground">{metric.unit}</div>
                <div className="text-sm font-medium mt-1">{metric.name}</div>
              </div>
            );
          })}
        </div>

        {/* Show first comparison if available */}
        {metrics[0]?.comparison && (
          <p className="text-center text-sm text-green-700 dark:text-green-300 mt-4 italic">
            {metrics[0].comparison}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
