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
  Sparkles,
} from "lucide-react";

// Icon mapping for impact metrics
const ICON_MAP: Record<string, LucideIcon> = {
  bottle: Wine,
  droplet: Droplet,
  leaf: Leaf,
  tree: TreeDeciduous,
  recycle: Recycle,
  trash: Trash2,
};

interface CartItem {
  productId: string;
  quantity: number;
}

interface ImpactPreview {
  metricId: string;
  name: string;
  slug: string;
  unit: string;
  iconName: string;
  estimatedValue: number;
}

interface CartImpactPreviewProps {
  items: CartItem[];
  className?: string;
}

export function CartImpactPreview({
  items,
  className,
}: CartImpactPreviewProps) {
  const [impacts, setImpacts] = useState<ImpactPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchPreview() {
      if (items.length === 0) {
        setImpacts([]);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch("/api/impact/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });

        const data = await response.json();

        if (response.ok) {
          setImpacts(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch impact preview:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreview();
  }, [items]);

  // Don't show anything if no impacts or loading
  if (isLoading || impacts.length === 0) {
    return null;
  }

  const formatValue = (val: number): string => {
    if (val >= 1) {
      return Math.round(val).toString();
    }
    return val.toFixed(1);
  };

  // Get top 3 impacts to show
  const topImpacts = impacts
    .filter((i) => i.estimatedValue > 0)
    .slice(0, 3);

  if (topImpacts.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:border-green-800 dark:from-green-950/50 dark:to-emerald-950/50",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-green-600" />
        <span className="text-sm font-medium text-green-800 dark:text-green-200">
          Your cart will make a difference!
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {topImpacts.map((impact) => {
          const Icon = ICON_MAP[impact.iconName] || Leaf;

          return (
            <div
              key={impact.metricId}
              className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 dark:bg-black/20"
            >
              <Icon className="size-4 text-green-600 dark:text-green-400" />
              <span className="text-sm">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatValue(impact.estimatedValue)}
                </span>
                <span className="ml-1 text-muted-foreground">
                  {impact.unit}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
