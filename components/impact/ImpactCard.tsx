"use client";

import { cn } from "@/lib/utils";
import {
  Droplet,
  Leaf,
  Recycle,
  TreeDeciduous,
  Trash2,
  Wine,
  LucideIcon,
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

interface ImpactCardProps {
  name: string;
  value: number;
  unit: string;
  iconName: string;
  comparison?: string | null;
  progress?: number;
  nextMilestone?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ImpactCard({
  name,
  value,
  unit,
  iconName,
  comparison,
  progress,
  nextMilestone,
  className,
  size = "md",
}: ImpactCardProps) {
  const Icon = ICON_MAP[iconName] || Leaf;

  const formatValue = (val: number): string => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    if (val >= 1) {
      return Math.round(val).toString();
    }
    return val.toFixed(1);
  };

  const sizeClasses = {
    sm: {
      card: "p-4",
      icon: "h-8 w-8",
      iconContainer: "h-12 w-12",
      value: "text-2xl",
      unit: "text-sm",
      title: "text-sm",
    },
    md: {
      card: "p-6",
      icon: "h-10 w-10",
      iconContainer: "h-16 w-16",
      value: "text-3xl",
      unit: "text-base",
      title: "text-base",
    },
    lg: {
      card: "p-8",
      icon: "h-12 w-12",
      iconContainer: "h-20 w-20",
      value: "text-4xl",
      unit: "text-lg",
      title: "text-lg",
    },
  };

  const classes = sizeClasses[size];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className={cn("flex flex-col items-center text-center", classes.card)}>
        {/* Icon */}
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30",
            classes.iconContainer
          )}
        >
          <Icon className={cn("text-green-600 dark:text-green-400", classes.icon)} />
        </div>

        {/* Value */}
        <div className="mb-2">
          <span className={cn("font-bold text-green-600 dark:text-green-400", classes.value)}>
            {formatValue(value)}
          </span>
          <span className={cn("ml-1 text-muted-foreground", classes.unit)}>{unit}</span>
        </div>

        {/* Title */}
        <h3 className={cn("mb-2 font-medium", classes.title)}>{name}</h3>

        {/* Progress bar toward next milestone */}
        {progress !== undefined && nextMilestone && (
          <div className="mt-2 w-full">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {formatValue(value)} / {formatValue(nextMilestone)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Comparison text */}
        {comparison && (
          <p className="mt-3 text-xs italic text-muted-foreground">{comparison}</p>
        )}
      </CardContent>
    </Card>
  );
}
