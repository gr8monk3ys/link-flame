'use client';

import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import {
  SubscriptionFrequency,
  FREQUENCY_LABELS,
  SUBSCRIPTION_DISCOUNTS,
} from '@/lib/subscriptions';
import { cn } from '@/lib/utils';

interface FrequencyOption {
  value: SubscriptionFrequency;
  label: string;
  discount: number;
  description: string;
}

const frequencyOptions: FrequencyOption[] = [
  {
    value: 'WEEKLY',
    label: FREQUENCY_LABELS.WEEKLY,
    discount: SUBSCRIPTION_DISCOUNTS.WEEKLY,
    description: 'Best savings for daily essentials',
  },
  {
    value: 'BIWEEKLY',
    label: FREQUENCY_LABELS.BIWEEKLY,
    discount: SUBSCRIPTION_DISCOUNTS.BIWEEKLY,
    description: 'Popular choice for regular use',
  },
  {
    value: 'MONTHLY',
    label: FREQUENCY_LABELS.MONTHLY,
    discount: SUBSCRIPTION_DISCOUNTS.MONTHLY,
    description: 'Great for occasional items',
  },
  {
    value: 'BIMONTHLY',
    label: FREQUENCY_LABELS.BIMONTHLY,
    discount: SUBSCRIPTION_DISCOUNTS.BIMONTHLY,
    description: 'Perfect for longer-lasting products',
  },
];

interface FrequencySelectorProps {
  selectedFrequency: SubscriptionFrequency;
  onFrequencyChange: (frequency: SubscriptionFrequency) => void;
  compact?: boolean;
}

export function FrequencySelector({
  selectedFrequency,
  onFrequencyChange,
  compact = false,
}: FrequencySelectorProps) {
  if (compact) {
    return (
      <div className="w-full">
        <label htmlFor="frequency-select" className="sr-only">
          Delivery frequency
        </label>
        <select
          id="frequency-select"
          value={selectedFrequency}
          onChange={(e) => onFrequencyChange(e.target.value as SubscriptionFrequency)}
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
        >
          {frequencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} - Save {option.discount}%
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <RadioGroup value={selectedFrequency} onChange={onFrequencyChange}>
      <RadioGroup.Label className="sr-only">Delivery frequency</RadioGroup.Label>
      <div className="space-y-2">
        {frequencyOptions.map((option) => (
          <RadioGroup.Option
            key={option.value}
            value={option.value}
            className={({ active, checked }) =>
              cn(
                active ? 'ring-2 ring-green-500 ring-offset-2' : '',
                checked
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50',
                'relative flex cursor-pointer rounded-lg border p-4 focus:outline-none'
              )
            }
          >
            {({ checked }) => (
              <>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <RadioGroup.Label
                        as="p"
                        className={cn(
                          checked ? 'text-green-900' : 'text-gray-900',
                          'font-medium'
                        )}
                      >
                        {option.label}
                      </RadioGroup.Label>
                      <RadioGroup.Description
                        as="span"
                        className={cn(
                          checked ? 'text-green-700' : 'text-gray-500',
                          'inline text-xs'
                        )}
                      >
                        {option.description}
                      </RadioGroup.Description>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        checked ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800',
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold'
                      )}
                    >
                      Save {option.discount}%
                    </span>
                    {checked && (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
                    )}
                  </div>
                </div>
              </>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
}

export default FrequencySelector;
