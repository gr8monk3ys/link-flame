/**
 * Subscribe & Save Utilities
 * Handles subscription logic, discount calculations, and frequency management
 */

// Subscription frequency types
export type SubscriptionFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY';

// Subscription status types
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

// Discount structure based on frequency
// More frequent = better discount (competitor parity)
export const SUBSCRIPTION_DISCOUNTS: Record<SubscriptionFrequency, number> = {
  WEEKLY: 20,     // 20% off for weekly deliveries
  BIWEEKLY: 15,   // 15% off for biweekly deliveries
  MONTHLY: 10,    // 10% off for monthly deliveries
  BIMONTHLY: 10,  // 10% off for bimonthly deliveries
};

// Human-readable frequency labels
export const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  WEEKLY: 'Every week',
  BIWEEKLY: 'Every 2 weeks',
  MONTHLY: 'Every month',
  BIMONTHLY: 'Every 2 months',
};

// Days between deliveries for each frequency
export const FREQUENCY_DAYS: Record<SubscriptionFrequency, number> = {
  WEEKLY: 7,
  BIWEEKLY: 14,
  MONTHLY: 30,
  BIMONTHLY: 60,
};

/**
 * Get the discount percentage for a given frequency
 */
export function getDiscountForFrequency(frequency: SubscriptionFrequency): number {
  return SUBSCRIPTION_DISCOUNTS[frequency] || 10;
}

/**
 * Calculate the discounted price for a subscription item
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  frequency: SubscriptionFrequency
): number {
  const discountPercent = getDiscountForFrequency(frequency);
  const discount = originalPrice * (discountPercent / 100);
  return Math.round((originalPrice - discount) * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate the savings amount
 */
export function calculateSavings(
  originalPrice: number,
  frequency: SubscriptionFrequency
): number {
  const discountPercent = getDiscountForFrequency(frequency);
  return Math.round((originalPrice * (discountPercent / 100)) * 100) / 100;
}

/**
 * Calculate the next delivery date based on frequency
 */
export function calculateNextDeliveryDate(
  frequency: SubscriptionFrequency,
  fromDate: Date = new Date()
): Date {
  const days = FREQUENCY_DAYS[frequency];
  const nextDate = new Date(fromDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

/**
 * Generate a human-readable subscription ID
 * Format: SUB-XXXXXX (6 alphanumeric characters)
 */
export function generateVisibleId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SUB-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if a subscription can be modified
 * (Only ACTIVE or PAUSED subscriptions can be modified)
 */
export function canModifySubscription(status: SubscriptionStatus): boolean {
  return status === 'ACTIVE' || status === 'PAUSED';
}

/**
 * Format a delivery schedule for display
 */
export function formatDeliverySchedule(
  frequency: SubscriptionFrequency,
  nextDeliveryDate: Date
): string {
  const frequencyLabel = FREQUENCY_LABELS[frequency];
  const dateStr = nextDeliveryDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `${frequencyLabel} - Next: ${dateStr}`;
}

/**
 * Calculate the total subscription value (for an order)
 */
export function calculateSubscriptionTotal(
  items: Array<{
    priceAtSubscription: number;
    discountPercent: number;
    quantity: number;
  }>
): {
  subtotal: number;
  totalDiscount: number;
  total: number;
} {
  let subtotal = 0;
  let totalDiscount = 0;

  for (const item of items) {
    const itemSubtotal = item.priceAtSubscription * item.quantity;
    const itemDiscount = itemSubtotal * (item.discountPercent / 100);
    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    total: Math.round((subtotal - totalDiscount) * 100) / 100,
  };
}

/**
 * Validate subscription frequency
 */
export function isValidFrequency(frequency: string): frequency is SubscriptionFrequency {
  return ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY'].includes(frequency);
}

/**
 * Validate subscription status
 */
export function isValidStatus(status: string): status is SubscriptionStatus {
  return ['ACTIVE', 'PAUSED', 'CANCELLED'].includes(status);
}
