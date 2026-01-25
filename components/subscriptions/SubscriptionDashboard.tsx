'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  SparklesIcon,
  ArrowPathIcon,
  PlusIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { SubscriptionCard } from './SubscriptionCard';
import {
  SubscriptionStatus,
  SubscriptionFrequency,
} from '@/lib/subscriptions';

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

type FilterStatus = 'all' | SubscriptionStatus;

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All subscriptions' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function SubscriptionDashboard() {
  const { data: session, status: authStatus } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`/api/subscriptions${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to load subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load subscriptions');
      setSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchSubscriptions();
    } else if (authStatus === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [authStatus, fetchSubscriptions]);

  // Filter subscriptions - memoized to prevent recalculation on every render
  // Must be defined before any conditional returns to follow Rules of Hooks
  const filteredSubscriptions = useMemo(
    () => filter === 'all'
      ? subscriptions
      : subscriptions.filter(sub => sub.status === filter),
    [subscriptions, filter]
  );

  // Calculate stats - memoized to prevent recalculation on every render
  const activeCount = useMemo(
    () => subscriptions.filter(s => s.status === 'ACTIVE').length,
    [subscriptions]
  );
  const pausedCount = useMemo(
    () => subscriptions.filter(s => s.status === 'PAUSED').length,
    [subscriptions]
  );

  // Show sign-in prompt if not authenticated
  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <SparklesIcon className="mx-auto size-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Sign in to manage subscriptions
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Create an account or sign in to view and manage your Subscribe &amp; Save subscriptions.
        </p>
        <div className="mt-6">
          <Link
            href="/auth/signin"
            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Subscribe & Save
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your recurring deliveries and save up to 20%
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
        >
          <PlusIcon className="mr-2 size-4" />
          Add subscription
        </Link>
      </div>

      {/* Stats */}
      {subscriptions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Total subscriptions</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {subscriptions.length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="mt-1 text-2xl font-semibold text-green-600">
              {activeCount}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Paused</p>
            <p className="mt-1 text-2xl font-semibold text-yellow-600">
              {pausedCount}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Avg. savings</p>
            <p className="mt-1 text-2xl font-semibold text-green-600">
              15%
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={fetchSubscriptions}
          disabled={isLoading}
          className="ml-auto inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowPathIcon className={`mr-1.5 size-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Subscriptions list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="size-8 animate-spin text-gray-400" />
        </div>
      ) : filteredSubscriptions.length > 0 ? (
        <div className="space-y-4">
          {filteredSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onUpdate={fetchSubscriptions}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <InboxIcon className="mx-auto size-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {filter === 'all'
              ? 'No subscriptions yet'
              : `No ${filter.toLowerCase()} subscriptions`}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {filter === 'all'
              ? 'Start saving with Subscribe & Save on your favorite products.'
              : 'Try changing the filter to see other subscriptions.'}
          </p>
          {filter === 'all' && (
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <SparklesIcon className="mr-2 size-4" />
                Browse products
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Help section */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Subscribe & Save Benefits
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-green-100 text-green-600">
              <SparklesIcon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Save up to 20%</p>
              <p className="text-xs text-gray-500">On every delivery</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-green-100 text-green-600">
              <ArrowPathIcon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Flexible schedule</p>
              <p className="text-xs text-gray-500">Weekly to bimonthly</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Skip anytime</p>
              <p className="text-xs text-gray-500">No commitment required</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Cancel anytime</p>
              <p className="text-xs text-gray-500">No cancellation fees</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionDashboard;
