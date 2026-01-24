'use client'

/**
 * Dynamic Import Utilities
 *
 * Provides code splitting patterns for heavy components.
 * Uses next/dynamic for optimal SSR handling.
 *
 * **When to use code splitting:**
 * - Modals and dialogs (not immediately visible)
 * - Dashboard components (complex, data-heavy)
 * - Feature components behind tabs
 * - Components with heavy dependencies (charts, maps)
 *
 * **Usage:**
 * ```tsx
 * import { DynamicQuizModal, DynamicImpactDashboard } from '@/lib/dynamic-imports'
 *
 * export default function Page() {
 *   return (
 *     <Suspense fallback={<LoadingSpinner />}>
 *       <DynamicQuizModal />
 *     </Suspense>
 *   )
 * }
 * ```
 */

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/loading-shimmer'

// Loading fallback components
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="rounded-lg bg-white p-8">
      <div className="size-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
    </div>
  </div>
)

const DashboardLoadingFallback = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid gap-4 md:grid-cols-3">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
)

const CardLoadingFallback = () => (
  <div className="animate-pulse rounded-lg border p-4">
    <Skeleton className="mb-2 h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
)

/**
 * Dynamically imported modals
 * These are loaded only when opened, reducing initial bundle size
 */
export const DynamicQuizModal = dynamic(
  () => import('@/components/quiz/QuizModal').then(mod => mod.QuizModal),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false, // Modals don't need SSR
  }
)

export const DynamicQuickViewModal = dynamic(
  () => import('@/components/products/QuickViewModal').then(mod => mod.default || mod),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
)

export const DynamicRedeemPointsModal = dynamic(
  () => import('@/components/loyalty/RedeemPointsModal').then(mod => mod.default || mod),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
)

export const DynamicCreateWishlistModal = dynamic(
  () => import('@/components/wishlists/CreateWishlistModal').then(mod => mod.CreateWishlistModal),
  {
    loading: () => <ModalLoadingFallback />,
    ssr: false,
  }
)

/**
 * Dynamically imported dashboards
 * These are heavy components with multiple sub-components and data fetching
 */
export const DynamicLoyaltyDashboard = dynamic(
  () => import('@/components/loyalty/LoyaltyDashboard').then(mod => mod.LoyaltyDashboard),
  {
    loading: () => <DashboardLoadingFallback />,
  }
)

export const DynamicSubscriptionDashboard = dynamic(
  () => import('@/components/subscriptions/SubscriptionDashboard').then(mod => mod.default || mod),
  {
    loading: () => <DashboardLoadingFallback />,
  }
)

export const DynamicReferralDashboard = dynamic(
  () => import('@/components/referrals/ReferralDashboard').then(mod => mod.ReferralDashboard),
  {
    loading: () => <DashboardLoadingFallback />,
  }
)

export const DynamicImpactDashboard = dynamic(
  () => import('@/components/impact/ImpactDashboard').then(mod => mod.ImpactDashboard),
  {
    loading: () => <DashboardLoadingFallback />,
  }
)

/**
 * Dynamically imported feature components
 * Components that are behind user interaction (tabs, accordions)
 */
export const DynamicBundleBuilder = dynamic(
  () => import('@/components/bundles/BundleBuilder').then(mod => mod.BundleBuilder),
  {
    loading: () => <CardLoadingFallback />,
  }
)

export const DynamicQuizResults = dynamic(
  () => import('@/components/quiz/QuizResults').then(mod => mod.QuizResults),
  {
    loading: () => <DashboardLoadingFallback />,
  }
)

/**
 * Helper to create custom dynamic imports with shared options
 */
export function createDynamicComponent<P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options: {
    loading?: () => React.ReactNode
    ssr?: boolean
  } = {}
) {
  return dynamic(
    () => importFn().then(mod => mod.default),
    {
      loading: options.loading ?? (() => <CardLoadingFallback />),
      ssr: options.ssr ?? true,
    }
  )
}
