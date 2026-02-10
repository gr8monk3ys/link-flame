'use client';

import { useState } from 'react';
import { Switch } from '@headlessui/react';
import { Sparkles, CalendarDays, Check } from 'lucide-react';
import { FrequencySelector } from './FrequencySelector';
import {
  SubscriptionFrequency,
  calculateDiscountedPrice,
  calculateSavings,
  getDiscountForFrequency,
} from '@/lib/subscriptions';
import { cn } from '@/lib/utils';

interface SubscribeOptionProps {
  originalPrice: number;
  productTitle: string;
  isSubscribable?: boolean;
  onSubscriptionChange: (isSubscription: boolean, frequency: SubscriptionFrequency | null) => void;
  defaultFrequency?: SubscriptionFrequency;
}

export function SubscribeOption({
  originalPrice,
  productTitle,
  isSubscribable = true,
  onSubscriptionChange,
  defaultFrequency = 'MONTHLY',
}: SubscribeOptionProps) {
  const [isSubscription, setIsSubscription] = useState(false);
  const [frequency, setFrequency] = useState<SubscriptionFrequency>(defaultFrequency);

  // If product is not subscribable, don't render anything
  if (!isSubscribable) {
    return null;
  }

  const handleSubscriptionToggle = (enabled: boolean) => {
    setIsSubscription(enabled);
    onSubscriptionChange(enabled, enabled ? frequency : null);
  };

  const handleFrequencyChange = (newFrequency: SubscriptionFrequency) => {
    setFrequency(newFrequency);
    if (isSubscription) {
      onSubscriptionChange(true, newFrequency);
    }
  };

  const discountedPrice = calculateDiscountedPrice(originalPrice, frequency);
  const savings = calculateSavings(originalPrice, frequency);
  const discountPercent = getDiscountForFrequency(frequency);

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
            <Sparkles className="size-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Subscribe & Save</h3>
            <p className="text-xs text-gray-500">Save up to 20% on recurring orders</p>
          </div>
        </div>
        <Switch
          checked={isSubscription}
          onChange={handleSubscriptionToggle}
          className={cn(
            isSubscription ? 'bg-green-600' : 'bg-gray-200',
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
          )}
        >
          <span className="sr-only">Enable subscription</span>
          <span
            aria-hidden="true"
            className={cn(
              isSubscription ? 'translate-x-5' : 'translate-x-0',
              'pointer-events-none inline-block size-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
            )}
          />
        </Switch>
      </div>

      {/* Purchase options */}
      <div className="mt-4 space-y-3">
        {/* One-time purchase option */}
        <button
          type="button"
          onClick={() => handleSubscriptionToggle(false)}
          className={cn(
            !isSubscription
              ? 'border-green-600 bg-white ring-2 ring-green-600'
              : 'border-gray-200 bg-white hover:border-gray-300',
            'relative flex w-full cursor-pointer items-center justify-between rounded-lg border p-3 focus:outline-none'
          )}
        >
          <div className="flex items-center">
            {!isSubscription && (
              <Check className="mr-2 size-5 text-green-600" />
            )}
            <span className="text-sm font-medium text-gray-900">One-time purchase</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            ${originalPrice.toFixed(2)}
          </span>
        </button>

        {/* Subscription option */}
        <button
          type="button"
          onClick={() => handleSubscriptionToggle(true)}
          className={cn(
            isSubscription
              ? 'border-green-600 bg-green-50 ring-2 ring-green-600'
              : 'border-gray-200 bg-white hover:border-gray-300',
            'relative flex w-full cursor-pointer flex-col rounded-lg border p-3 focus:outline-none'
          )}
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center">
              {isSubscription && (
                <Check className="mr-2 size-5 text-green-600" />
              )}
              <span className="text-sm font-medium text-gray-900">Subscribe & Save</span>
              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                Save {discountPercent}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-green-600">
                ${discountedPrice.toFixed(2)}
              </span>
              <span className="ml-1 text-xs text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            </div>
          </div>
          {isSubscription && (
            <div className="mt-1 flex items-center text-xs text-green-700">
              <CalendarDays className="mr-1 size-4" />
              <span>
                You save ${savings.toFixed(2)} per delivery
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Frequency selector (only shown when subscription is selected) */}
      {isSubscription && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Delivery frequency
          </label>
          <FrequencySelector
            selectedFrequency={frequency}
            onFrequencyChange={handleFrequencyChange}
            compact={false}
          />
        </div>
      )}

      {/* Benefits */}
      {isSubscription && (
        <div className="mt-4 rounded-md bg-green-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-green-800">
            Subscription Benefits
          </h4>
          <ul className="mt-2 space-y-1 text-xs text-green-700">
            <li className="flex items-center">
              <Check className="mr-2 size-4" />
              Save {discountPercent}% on every delivery
            </li>
            <li className="flex items-center">
              <Check className="mr-2 size-4" />
              Free shipping on subscription orders
            </li>
            <li className="flex items-center">
              <Check className="mr-2 size-4" />
              Skip, pause, or cancel anytime
            </li>
            <li className="flex items-center">
              <Check className="mr-2 size-4" />
              Exclusive subscriber-only offers
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SubscribeOption;
