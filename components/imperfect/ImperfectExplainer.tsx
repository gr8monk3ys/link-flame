'use client';

import { cn } from '@/lib/utils';

interface ImperfectExplainerProps {
  variant?: 'full' | 'compact' | 'faq';
  className?: string;
}

/**
 * ImperfectExplainer - Educational component explaining the Perfectly Imperfect program
 * Helps customers understand the value proposition and builds trust
 */
export function ImperfectExplainer({ variant = 'full', className }: ImperfectExplainerProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6',
          className
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <QuestionMarkIcon className="size-6 text-amber-700" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">What does "Perfectly Imperfect" mean?</h3>
            <p className="mt-2 text-sm text-amber-800">
              These products have minor cosmetic issues like dented packaging or label misprints,
              but the quality inside is 100% the same. You get the same great product at a
              significantly reduced price while helping reduce waste.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'faq') {
    return (
      <div className={cn('space-y-6', className)}>
        <h2 className="text-2xl font-bold text-gray-900">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {FAQ_ITEMS.map((faq, index) => (
            <details
              key={index}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDownIcon className="size-5 text-gray-500 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <section className={cn('py-16', className)} id="how-it-works">
      <div className="mb-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
          <LeafIcon className="size-4" />
          Reduce Waste, Save More
        </span>
        <h2 className="mt-6 text-3xl font-bold text-gray-900 sm:text-4xl">
          How Perfectly Imperfect Works
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Same quality products at lower prices. Here's why choosing imperfect is the smart
          (and sustainable) choice.
        </p>
      </div>

      {/* How it works steps */}
      <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <div key={index} className="text-center">
            <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-amber-100">
              <step.icon className="size-8 text-amber-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">{step.title}</h3>
            <p className="text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Common imperfections */}
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-lg md:p-12">
        <h3 className="mb-8 text-center text-2xl font-bold text-gray-900">
          What makes something "Imperfect"?
        </h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {IMPERFECT_TYPES.map((type, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-xl bg-gray-50 p-4"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <type.icon className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{type.label}</p>
                <p className="mt-1 text-sm text-gray-600">{type.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quality guarantee */}
        <div className="mt-12 flex items-center gap-6 rounded-2xl bg-green-50 p-6">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon className="size-8 text-green-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-green-900">
              100% Quality Guarantee
            </h4>
            <p className="mt-1 text-green-800">
              Every imperfect item comes with the same quality guarantee as our regular products.
              If you're not satisfied for any reason, return it for a full refund.
            </p>
          </div>
        </div>
      </div>

      {/* Environmental impact */}
      <div className="mt-16 rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 p-8 md:p-12">
        <div className="mb-10 text-center">
          <h3 className="text-2xl font-bold text-green-900">
            Your Impact
          </h3>
          <p className="mt-2 text-green-800">
            By choosing imperfect, you're helping make a difference
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {IMPACT_STATS.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-4xl font-bold text-green-900">{stat.value}</p>
              <p className="mt-2 text-green-800">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Data
const STEPS = [
  {
    title: 'Minor Imperfections',
    description:
      'Products with cosmetic issues like dented packaging or label misprints that don\'t affect quality.',
    icon: PackageIcon,
  },
  {
    title: 'Big Savings',
    description:
      'Save up to 47% off regular prices. Same great product, just not picture-perfect.',
    icon: TagIcon,
  },
  {
    title: 'Reduce Waste',
    description:
      'Help keep perfectly good products out of landfills while saving money.',
    icon: LeafIcon,
  },
];

const IMPERFECT_TYPES = [
  {
    label: 'Packaging Issues',
    description: 'Dents, scratches, or tears on outer packaging',
    icon: PackageIcon,
  },
  {
    label: 'Label Problems',
    description: 'Misprints, smudges, or faded labels',
    icon: TagIcon,
  },
  {
    label: 'Short Expiry',
    description: 'Approaching best-by date but still fresh',
    icon: CalendarIcon,
  },
  {
    label: 'Overstock',
    description: 'Perfect items we need to clear out',
    icon: StackIcon,
  },
];

const IMPACT_STATS = [
  { value: '2,500+', label: 'Products saved from landfills' },
  { value: '15 tons', label: 'Waste diverted this year' },
  { value: '$50,000+', label: 'Saved by our community' },
];

const FAQ_ITEMS = [
  {
    question: 'Is the quality different from regular products?',
    answer:
      'Absolutely not! The product quality is exactly the same. The only difference is cosmetic imperfections on the packaging or minor issues that don\'t affect the product inside.',
  },
  {
    question: 'Can I return an imperfect item?',
    answer:
      'Yes! All imperfect items come with the same return policy as our regular products. If you\'re not satisfied for any reason, you can return it for a full refund.',
  },
  {
    question: 'Why are imperfect items discounted?',
    answer:
      'These items can\'t be sold as "new" at full price due to cosmetic issues, but throwing them away would create unnecessary waste. We pass the savings on to you while reducing our environmental impact.',
  },
  {
    question: 'Are imperfect items used or refurbished?',
    answer:
      'No, imperfect items are brand new. They may have been opened for inspection or quality control, but the products inside have never been used.',
  },
  {
    question: 'How often do you add new imperfect items?',
    answer:
      'We add new imperfect items weekly. Sign up for our newsletter to be notified when new deals become available.',
  },
];

// Icon components
function LeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function StackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function QuestionMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export default ImperfectExplainer;
