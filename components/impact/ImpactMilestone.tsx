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
  PartyPopper,
  X,
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

interface MilestoneData {
  metricSlug: string;
  metricName: string;
  milestone: number;
  unit: string;
  iconName: string;
}

interface ImpactMilestoneProps {
  milestone: MilestoneData;
  onClose: () => void;
  autoCloseMs?: number;
}

export function ImpactMilestone({
  milestone,
  onClose,
  autoCloseMs = 8000,
}: ImpactMilestoneProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const Icon = ICON_MAP[milestone.iconName] || Leaf;

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseMs);

    return () => clearTimeout(timer);
  }, [autoCloseMs]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
        isExiting ? "opacity-0" : "opacity-100"
      )}
      onClick={handleClose}
    >
      <div
        className={cn(
          "relative bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 rounded-2xl p-8 max-w-md w-full shadow-2xl transition-all duration-300",
          isExiting ? "scale-95 opacity-0" : "scale-100 opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Celebration icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <PartyPopper className="h-16 w-16 text-yellow-500 animate-bounce" />
            <div className="absolute -top-2 -right-2">
              <span className="text-2xl">🎉</span>
            </div>
          </div>
        </div>

        {/* Milestone message */}
        <h2 className="text-2xl font-bold text-center text-green-800 dark:text-green-200 mb-2">
          Milestone Achieved!
        </h2>

        <p className="text-center text-green-700 dark:text-green-300 mb-6">
          You&apos;ve reached an amazing goal!
        </p>

        {/* Metric display */}
        <div className="bg-white/50 dark:bg-black/20 rounded-xl p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Icon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
            {milestone.milestone}
          </div>
          <div className="text-lg text-muted-foreground mb-2">
            {milestone.unit}
          </div>
          <div className="font-medium text-green-800 dark:text-green-200">
            {milestone.metricName}
          </div>
        </div>

        {/* Encouragement */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Thank you for making a difference! Keep up the amazing work.
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to manage milestone celebrations
 */
export function useMilestoneNotifications() {
  const [pendingMilestones, setPendingMilestones] = useState<MilestoneData[]>([]);
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneData | null>(null);

  const addMilestones = (milestones: MilestoneData[]) => {
    setPendingMilestones((prev) => [...prev, ...milestones]);
  };

  const showNextMilestone = () => {
    if (pendingMilestones.length > 0) {
      setCurrentMilestone(pendingMilestones[0]);
      setPendingMilestones((prev) => prev.slice(1));
    } else {
      setCurrentMilestone(null);
    }
  };

  const dismissCurrent = () => {
    showNextMilestone();
  };

  // Auto-show first milestone when added
  useEffect(() => {
    if (!currentMilestone && pendingMilestones.length > 0) {
      showNextMilestone();
    }
  }, [pendingMilestones, currentMilestone]);

  return {
    currentMilestone,
    addMilestones,
    dismissCurrent,
    hasPendingMilestones: pendingMilestones.length > 0,
  };
}
