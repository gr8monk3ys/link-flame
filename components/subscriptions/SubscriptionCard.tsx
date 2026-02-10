'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { CalendarDays, Pause, Play, RefreshCw, X, ChevronRight, Truck } from 'lucide-react';
import {
  SubscriptionFrequency,
  SubscriptionStatus,
  FREQUENCY_LABELS,
  calculateSubscriptionTotal,
} from '@/lib/subscriptions';
import { cn } from '@/lib/utils';

interface SubscriptionItem {
  id: string;
  quantity: number;
  priceAtSubscription: number;
  discountPercent: number;
  product: {
    id: string;
    title: string;
    image: string;
    price: number;
    salePrice: number | null;
  };
  variant: {
    id: string;
    sku: string | null;
    size: string | null;
    color: string | null;
    colorCode: string | null;
    material: string | null;
    image: string | null;
  } | null;
}

interface Subscription {
  id: string;
  visibleId: string;
  status: SubscriptionStatus;
  frequency: SubscriptionFrequency;
  nextDeliveryDate: string;
  lastDeliveryDate: string | null;
  skipNextDelivery: boolean;
  createdAt: string;
  items: SubscriptionItem[];
}

interface SubscriptionCardProps {
  subscription: Subscription;
  onUpdate?: () => void;
}

const statusColors: Record<SubscriptionStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
};

export function SubscriptionCard({ subscription, onUpdate }: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize subscription total calculation to avoid recalculating on every render
  const totals = useMemo(
    () => calculateSubscriptionTotal(subscription.items),
    [subscription.items]
  );
  const nextDeliveryDate = new Date(subscription.nextDeliveryDate);
  const isActive = subscription.status === 'ACTIVE';
  const isPaused = subscription.status === 'PAUSED';
  const isCancelled = subscription.status === 'CANCELLED';

  const handlePauseResume = async () => {
    setIsLoading(true);
    try {
      const newStatus = isActive ? 'PAUSED' : 'ACTIVE';
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update subscription');
      }

      toast.success(isActive ? 'Subscription paused' : 'Subscription resumed');
      onUpdate?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipDelivery = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/skip`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to skip delivery');
      }

      toast.success('Next delivery skipped');
      onUpdate?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to skip delivery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this subscription? You can resubscribe anytime.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to cancel subscription');
      }

      toast.success('Subscription cancelled');
      onUpdate?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">
              {subscription.visibleId}
            </span>
            <span
              className={cn(
                statusColors[subscription.status],
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
              )}
            >
              {statusLabels[subscription.status]}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-500"
          >
            <ChevronRight
              className={cn(
                'size-5 transition-transform',
                isExpanded ? 'rotate-90' : ''
              )}
            />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4">
        {/* Items preview */}
        <div className="flex items-start gap-4">
          <div className="flex -space-x-2">
            {subscription.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="relative size-12 overflow-hidden rounded-full border-2 border-white bg-gray-100"
              >
                <Image
                  src={item.variant?.image || item.product.image}
                  alt={item.product.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ))}
            {subscription.items.length > 3 && (
              <div className="flex size-12 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-medium text-gray-600">
                +{subscription.items.length - 3}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {subscription.items.length} item{subscription.items.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-500">
              {FREQUENCY_LABELS[subscription.frequency]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              ${totals.total.toFixed(2)}
            </p>
            <p className="text-xs text-green-600">
              Save ${totals.totalDiscount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Next delivery info */}
        {isActive && (
          <div className="mt-4 flex items-center rounded-lg bg-green-50 px-3 py-2">
            <Truck className="mr-2 size-5 text-green-600" />
            <span className="text-sm text-green-800">
              Next delivery: {nextDeliveryDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        )}

        {isPaused && (
          <div className="mt-4 flex items-center rounded-lg bg-yellow-50 px-3 py-2">
            <Pause className="mr-2 size-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Subscription is paused. Resume to continue deliveries.
            </span>
          </div>
        )}

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            {/* Items list */}
            <h4 className="mb-2 text-sm font-medium text-gray-900">Items</h4>
            <ul className="divide-y divide-gray-100">
              {subscription.items.map((item) => {
                const discountedPrice = item.priceAtSubscription * (1 - item.discountPercent / 100);
                return (
                  <li key={item.id} className="flex items-center gap-3 py-2">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded bg-gray-100">
                      <Image
                        src={item.variant?.image || item.product.image}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-green-600"
                      >
                        {item.product.title}
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-gray-500">
                          {[item.variant.size, item.variant.color, item.variant.material]
                            .filter(Boolean)
                            .join(' / ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {item.quantity} x ${discountedPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 line-through">
                        ${item.priceAtSubscription.toFixed(2)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Summary */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Subscribe & Save discount</span>
                <span className="text-green-600">-${totals.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-sm font-semibold">
                <span className="text-gray-900">Total per delivery</span>
                <span className="text-gray-900">${totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isCancelled && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {isActive && (
              <>
                <button
                  type="button"
                  onClick={handleSkipDelivery}
                  disabled={isLoading}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className="mr-1.5 size-4" />
                  Skip next delivery
                </button>
                <button
                  type="button"
                  onClick={handlePauseResume}
                  disabled={isLoading}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pause className="mr-1.5 size-4" />
                  Pause
                </button>
              </>
            )}
            {isPaused && (
              <button
                type="button"
                onClick={handlePauseResume}
                disabled={isLoading}
                className="inline-flex items-center rounded-md border border-green-600 bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="mr-1.5 size-4" />
                Resume
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="mr-1.5 size-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionCard;
