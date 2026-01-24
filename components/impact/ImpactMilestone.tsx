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
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-300",
        isExiting ? "opacity-0" : "opacity-100"
      )}
      onClick={handleClose}
    >
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 p-8 shadow-2xl transition-all duration-300 dark:from-green-950 dark:to-emerald-900",
          isExiting ? "scale-95 opacity-0" : "scale-100 opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {/* Celebration icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <PartyPopper className="size-16 animate-bounce text-yellow-500" />
            <div className="absolute -right-2 -top-2">
              <span className="text-2xl">🎉</span>
            </div>
          </div>
        </div>

        {/* Milestone message */}
        <h2 className="mb-2 text-center text-2xl font-bold text-green-800 dark:text-green-200">
          Milestone Achieved!
        </h2>

        <p className="mb-6 text-center text-green-700 dark:text-green-300">
          You&apos;ve reached an amazing goal!
        </p>

        {/* Metric display */}
        <div className="rounded-xl bg-white/50 p-6 text-center dark:bg-black/20">
          <div className="mb-3 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-500/20">
              <Icon className="size-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="mb-1 text-4xl font-bold text-green-600 dark:text-green-400">
            {milestone.milestone}
          </div>
          <div className="mb-2 text-lg text-muted-foreground">
            {milestone.unit}
          </div>
          <div className="font-medium text-green-800 dark:text-green-200">
            {milestone.metricName}
          </div>
        </div>

        {/* Encouragement */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
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
