"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { ImpactCard } from "./ImpactCard";
import { Loader2, RefreshCw, Share2, TrendingUp } from "lucide-react";

const ImpactShareCard = dynamic(
  () => import("./ImpactShareCard").then((mod) => mod.ImpactShareCard),
  { ssr: false, loading: () => null }
);
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ImpactMetric {
  id: string;
  metricId: string;
  name: string;
  slug: string;
  unit: string;
  iconName: string;
  totalValue: number;
  comparison: string | null;
  nextMilestone: number | null;
  progress: number;
  lastUpdatedAt: string;
}

interface ImpactDashboardProps {
  className?: string;
}

export function ImpactDashboard({ className }: ImpactDashboardProps) {
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);

  const fetchImpact = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/impact/personal");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch impact data");
      }

      setMetrics(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImpact();
  }, []);

  const totalImpactValue = metrics.reduce((sum, m) => sum + m.totalValue, 0);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={fetchImpact}>
            <RefreshCw className="mr-2 size-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (metrics.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-green-600" />
            Your Environmental Impact
          </CardTitle>
          <CardDescription>
            Start your eco-friendly journey today!
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="size-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-semibold">No Impact Yet</h3>
          <p className="mx-auto max-w-md text-muted-foreground">
            When you make eco-friendly purchases, your positive environmental
            impact will be tracked here. Start shopping sustainably to see your
            contribution to a greener planet!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-green-600" />
                Your Environmental Impact
              </CardTitle>
              <CardDescription>
                Track your contribution to a sustainable future
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareCard(true)}
              >
                <Share2 className="mr-2 size-4" />
                Share
              </Button>
              <Button variant="ghost" size="sm" onClick={fetchImpact} aria-label="Refresh impact data">
                <RefreshCw className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Impact Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <ImpactCard
            key={metric.metricId}
            name={metric.name}
            value={metric.totalValue}
            unit={metric.unit}
            iconName={metric.iconName}
            comparison={metric.comparison}
            progress={metric.progress}
            nextMilestone={metric.nextMilestone}
          />
        ))}
      </div>

      {/* Share Card Modal */}
      {showShareCard && (
        <ImpactShareCard
          metrics={metrics}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}
