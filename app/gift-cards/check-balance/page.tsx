import { Metadata } from 'next'
import { GiftCardBalance } from '@/components/gift-cards'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Check Gift Card Balance | Link Flame',
  description:
    'Check your Link Flame gift card balance. Enter your gift card code to see your current balance, transaction history, and expiration date.',
  openGraph: {
    title: 'Check Gift Card Balance | Link Flame',
    description: 'Check your Link Flame gift card balance and transaction history.',
    type: 'website',
  },
}

export default function CheckBalancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/gift-cards"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <svg
            className="mr-2 size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Gift Cards
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-green-100 p-3">
          <svg
            className="size-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <h1 className="mb-3 text-3xl font-bold">Check Gift Card Balance</h1>
        <p className="mx-auto max-w-lg text-muted-foreground">
          Enter your 16-digit gift card code to check your current balance,
          view transaction history, and see the expiration date.
        </p>
      </div>

      {/* Balance Checker */}
      <div className="mx-auto max-w-md">
        <GiftCardBalance />
      </div>

      {/* Help Section */}
      <div className="mx-auto mt-12 max-w-2xl">
        <h2 className="mb-6 text-center text-xl font-semibold">
          Need Help?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-5">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-medium">Where is my code?</h3>
            <p className="text-sm text-muted-foreground">
              Your gift card code was sent to the email address provided during purchase.
              Check your inbox and spam folder.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-medium">Lost your gift card?</h3>
            <p className="text-sm text-muted-foreground">
              Contact our support team with your purchase details and we can help
              recover your gift card code.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-medium">Card expiring soon?</h3>
            <p className="text-sm text-muted-foreground">
              Gift cards are valid for 1 year. Use your balance before the expiration
              date to avoid losing value.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-medium">How to use your card</h3>
            <p className="text-sm text-muted-foreground">
              Enter your gift card code at checkout to apply the balance to your order.
              Any remaining balance stays on the card.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="mx-auto mt-12 max-w-md text-center">
        <p className="text-sm text-muted-foreground">
          Still having trouble? Our support team is here to help.
        </p>
        <Link
          href="/contact"
          className="mt-3 inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700"
        >
          Contact Support
          <svg
            className="ml-1 size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}
