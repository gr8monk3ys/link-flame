/**
 * Environmental Impact Calculation and Management Utilities
 *
 * This module provides functions for calculating, storing, and retrieving
 * environmental impact metrics for users, orders, and products.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Impact metric definitions with comparison calculations
 */
export const IMPACT_COMPARISONS: Record<string, (value: number) => string> = {
  "plastic-bottles-saved": (value) =>
    `That's ${Math.round(value / 3)} weeks of single-use plastic avoided!`,
  "single-use-items-replaced": (value) =>
    `Equivalent to ${Math.round(value / 30)} months of disposable items!`,
  "carbon-offset": (value) =>
    `Like planting ${Math.round(value / 21)} trees for a year!`,
  "trees-planted": (value) =>
    `${Math.round(value * 20)} kg of CO2 absorbed per year!`,
  "water-saved": (value) =>
    `That's ${Math.round(value / 50)} showers worth of water!`,
  "waste-diverted": (value) =>
    `${Math.round(value * 2.2)} pounds kept out of landfills!`,
};

/**
 * Milestone definitions for celebrations
 */
export const MILESTONES = {
  "plastic-bottles-saved": [10, 50, 100, 250, 500, 1000],
  "single-use-items-replaced": [25, 100, 250, 500, 1000, 2500],
  "carbon-offset": [5, 25, 50, 100, 250, 500],
  "trees-planted": [1, 5, 10, 25, 50, 100],
  "water-saved": [100, 500, 1000, 2500, 5000, 10000],
  "waste-diverted": [1, 5, 10, 25, 50, 100],
};

/**
 * Get the next milestone for a given metric and current value
 */
export function getNextMilestone(
  metricSlug: string,
  currentValue: number
): number | null {
  const milestones = MILESTONES[metricSlug as keyof typeof MILESTONES];
  if (!milestones) return null;

  for (const milestone of milestones) {
    if (currentValue < milestone) {
      return milestone;
    }
  }
  return null; // All milestones achieved
}

/**
 * Check if a milestone was just achieved
 */
export function checkMilestoneAchieved(
  metricSlug: string,
  previousValue: number,
  newValue: number
): number | null {
  const milestones = MILESTONES[metricSlug as keyof typeof MILESTONES];
  if (!milestones) return null;

  for (const milestone of milestones) {
    if (previousValue < milestone && newValue >= milestone) {
      return milestone;
    }
  }
  return null;
}

/**
 * Calculate impact for a list of order items
 */
export async function calculateOrderImpact(
  items: Array<{ productId: string; quantity: number }>
): Promise<Map<string, number>> {
  const impactMap = new Map<string, number>();

  // Get product impacts for all products in the order
  const productIds = items.map((item) => item.productId);
  const productImpacts = await prisma.productImpact.findMany({
    where: { productId: { in: productIds } },
    include: { metric: true },
  });

  // Calculate total impact for each metric
  for (const item of items) {
    const impacts = productImpacts.filter((pi) => pi.productId === item.productId);
    for (const impact of impacts) {
      const currentValue = impactMap.get(impact.metricId) || 0;
      impactMap.set(
        impact.metricId,
        currentValue + impact.valuePerUnit * item.quantity
      );
    }
  }

  return impactMap;
}

/**
 * Store impact for a completed order
 */
export async function storeOrderImpact(
  orderId: string,
  userId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<{
  orderImpacts: Array<{ metricId: string; value: number }>;
  milestones: Array<{ metricSlug: string; milestone: number }>;
}> {
  const impactMap = await calculateOrderImpact(items);
  const milestones: Array<{ metricSlug: string; milestone: number }> = [];

  // Get all metrics for reference
  const metrics = await prisma.impactMetric.findMany({
    where: { isActive: true },
  });
  const metricById = new Map(metrics.map((m) => [m.id, m]));

  // Store order impacts and update user impacts in a transaction
  await prisma.$transaction(async (tx) => {
    for (const [metricId, value] of impactMap) {
      // Create order impact record
      await tx.orderImpact.create({
        data: {
          orderId,
          metricId,
          value,
        },
      });

      // Get current user impact
      const existingUserImpact = await tx.userImpact.findUnique({
        where: {
          userId_metricId: { userId, metricId },
        },
      });

      const previousValue = existingUserImpact?.totalValue || 0;
      const newValue = previousValue + value;

      // Upsert user impact
      await tx.userImpact.upsert({
        where: {
          userId_metricId: { userId, metricId },
        },
        create: {
          userId,
          metricId,
          totalValue: value,
        },
        update: {
          totalValue: newValue,
          lastUpdatedAt: new Date(),
        },
      });

      // Check for milestone achievement
      const metric = metricById.get(metricId);
      if (metric) {
        const milestone = checkMilestoneAchieved(
          metric.slug,
          previousValue,
          newValue
        );
        if (milestone) {
          milestones.push({ metricSlug: metric.slug, milestone });
        }
      }
    }
  });

  return {
    orderImpacts: Array.from(impactMap).map(([metricId, value]) => ({
      metricId,
      value,
    })),
    milestones,
  };
}

/**
 * Get personal impact for a user
 */
export async function getPersonalImpact(userId: string) {
  const userImpacts = await prisma.userImpact.findMany({
    where: { userId },
    include: {
      metric: true,
    },
    orderBy: {
      metric: {
        sortOrder: "asc",
      },
    },
  });

  return userImpacts.map((ui) => ({
    id: ui.id,
    metricId: ui.metricId,
    name: ui.metric.name,
    slug: ui.metric.slug,
    unit: ui.metric.unit,
    iconName: ui.metric.iconName,
    totalValue: ui.totalValue,
    comparison: IMPACT_COMPARISONS[ui.metric.slug]?.(ui.totalValue) || null,
    nextMilestone: getNextMilestone(ui.metric.slug, ui.totalValue),
    progress: getNextMilestone(ui.metric.slug, ui.totalValue)
      ? (ui.totalValue / getNextMilestone(ui.metric.slug, ui.totalValue)!) * 100
      : 100,
    lastUpdatedAt: ui.lastUpdatedAt,
  }));
}

/**
 * Get community (aggregate) impact
 */
export async function getCommunityImpact() {
  // Get all active metrics
  const metrics = await prisma.impactMetric.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Calculate totals for each metric
  const results = await Promise.all(
    metrics.map(async (metric) => {
      const aggregate = await prisma.userImpact.aggregate({
        where: { metricId: metric.id },
        _sum: { totalValue: true },
        _count: { userId: true },
      });

      const totalValue = aggregate._sum.totalValue || 0;
      const contributorCount = aggregate._count.userId || 0;

      return {
        metricId: metric.id,
        name: metric.name,
        slug: metric.slug,
        unit: metric.unit,
        iconName: metric.iconName,
        description: metric.description,
        totalValue,
        contributorCount,
        comparison: IMPACT_COMPARISONS[metric.slug]?.(totalValue) || null,
      };
    })
  );

  return results;
}

/**
 * Get impact for a specific order
 */
export async function getOrderImpact(orderId: string) {
  const orderImpacts = await prisma.orderImpact.findMany({
    where: { orderId },
    include: {
      metric: true,
    },
    orderBy: {
      metric: {
        sortOrder: "asc",
      },
    },
  });

  return orderImpacts.map((oi) => ({
    metricId: oi.metricId,
    name: oi.metric.name,
    slug: oi.metric.slug,
    unit: oi.metric.unit,
    iconName: oi.metric.iconName,
    value: oi.value,
    comparison: IMPACT_COMPARISONS[oi.metric.slug]?.(oi.value) || null,
  }));
}

/**
 * Get estimated impact preview for cart items (before order)
 */
export async function getCartImpactPreview(
  items: Array<{ productId: string; quantity: number }>
): Promise<
  Array<{
    metricId: string;
    name: string;
    slug: string;
    unit: string;
    iconName: string;
    estimatedValue: number;
  }>
> {
  const impactMap = await calculateOrderImpact(items);

  // Get metrics for the impacts
  const metricIds = Array.from(impactMap.keys());
  const metrics = await prisma.impactMetric.findMany({
    where: {
      id: { in: metricIds },
      isActive: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  return metrics.map((metric) => ({
    metricId: metric.id,
    name: metric.name,
    slug: metric.slug,
    unit: metric.unit,
    iconName: metric.iconName,
    estimatedValue: impactMap.get(metric.id) || 0,
  }));
}

/**
 * Format impact value for display
 */
export function formatImpactValue(value: number, unit: string): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k ${unit}`;
  }
  if (value >= 1) {
    return `${Math.round(value)} ${unit}`;
  }
  return `${value.toFixed(1)} ${unit}`;
}

/**
 * Get all active impact metrics (for admin/configuration)
 */
export async function getActiveMetrics() {
  return prisma.impactMetric.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}
