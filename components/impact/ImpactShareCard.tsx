"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Droplet,
  Leaf,
  Recycle,
  TreeDeciduous,
  Trash2,
  Wine,
  LucideIcon,
  X,
  Copy,
  Twitter,
  Facebook,
  Download,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Icon mapping for impact metrics
const ICON_MAP: Record<string, LucideIcon> = {
  bottle: Wine,
  droplet: Droplet,
  leaf: Leaf,
  tree: TreeDeciduous,
  recycle: Recycle,
  trash: Trash2,
};

interface ImpactMetric {
  metricId: string;
  name: string;
  slug: string;
  unit: string;
  iconName: string;
  totalValue: number;
}

interface ImpactShareCardProps {
  metrics: ImpactMetric[];
  onClose: () => void;
}

export function ImpactShareCard({ metrics, onClose }: ImpactShareCardProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const formatValue = (val: number): string => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    if (val >= 1) {
      return Math.round(val).toString();
    }
    return val.toFixed(1);
  };

  // Generate share text
  const generateShareText = () => {
    const highlights = metrics
      .filter((m) => m.totalValue > 0)
      .slice(0, 3)
      .map((m) => `${formatValue(m.totalValue)} ${m.unit} ${m.name.toLowerCase()}`)
      .join(", ");

    return `I've made a positive environmental impact: ${highlights}! Join me in shopping sustainably. #EcoFriendly #Sustainability`;
  };

  const shareText = generateShareText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleTwitterShare = () => {
    const url = encodeURIComponent(window.location.origin);
    const text = encodeURIComponent(shareText);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.origin);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
      "width=600,height=400"
    );
  };

  // Get top 3 metrics to display
  const topMetrics = metrics
    .filter((m) => m.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-background rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Share Card Preview */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 p-8"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-1">
              My Environmental Impact
            </h2>
            <p className="text-sm text-green-600 dark:text-green-400">
              Making a difference, one purchase at a time
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {topMetrics.map((metric) => {
              const Icon = ICON_MAP[metric.iconName] || Leaf;
              return (
                <div
                  key={metric.metricId}
                  className="bg-white/60 dark:bg-black/20 rounded-xl p-4 text-center"
                >
                  <div className="flex justify-center mb-2">
                    <Icon className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatValue(metric.totalValue)}
                  </div>
                  <div className="text-xs text-muted-foreground">{metric.unit}</div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Shop sustainably at Link Flame
            </p>
          </div>
        </div>

        {/* Share Actions */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-center">Share Your Impact</h3>

          {/* Share Buttons */}
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleTwitterShare}
            >
              <Twitter className="h-5 w-5 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleFacebookShare}
            >
              <Facebook className="h-5 w-5 mr-2" />
              Facebook
            </Button>
          </div>

          {/* Copy Text */}
          <div className="relative">
            <textarea
              readOnly
              value={shareText}
              className="w-full p-3 pr-12 text-sm bg-muted rounded-lg resize-none"
              rows={3}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
