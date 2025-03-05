/**
 * Feature flags system for safely rolling out new features
 * 
 * Usage:
 * import { isFeatureEnabled } from '@/lib/feature-flags';
 * 
 * // In component
 * {isFeatureEnabled('enhancedRecommendations') ? (
 *   <EnhancedRecommendations />
 * ) : (
 *   <StandardRecommendations />
 * )}
 */

// Define all available feature flags
export type FeatureFlag = 
  | 'enhancedRecommendations' 
  | 'newCheckout' 
  | 'savedItemsSync'
  | 'cartPersistence'
  | 'productComparison';

// Configure feature flags - this could be loaded from an API or environment variables
const FEATURE_FLAGS: Record<FeatureFlag, boolean> = {
  enhancedRecommendations: true,
  newCheckout: false,
  savedItemsSync: false,
  cartPersistence: true,
  productComparison: false,
};

/**
 * Check if a feature flag is enabled
 * @param flag The feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}

/**
 * Get all enabled feature flags
 * @returns Array of enabled feature flags
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([flag]) => flag as FeatureFlag);
}

/**
 * Check if any of the specified feature flags are enabled
 * @param flags Array of feature flags to check
 * @returns boolean indicating if any of the features are enabled
 */
export function isAnyFeatureEnabled(flags: FeatureFlag[]): boolean {
  return flags.some(flag => isFeatureEnabled(flag));
}

/**
 * Check if all of the specified feature flags are enabled
 * @param flags Array of feature flags to check
 * @returns boolean indicating if all of the features are enabled
 */
export function areAllFeaturesEnabled(flags: FeatureFlag[]): boolean {
  return flags.every(flag => isFeatureEnabled(flag));
}
