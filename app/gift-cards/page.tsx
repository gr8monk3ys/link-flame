import { Metadata } from 'next'
import { GiftCardPurchase, GiftCardBalance } from '@/components/gift-cards'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Gift Cards | Link Flame',
  description:
    'Give the gift of sustainable living with Link Flame gift cards. Perfect for any occasion, our gift cards let your loved ones choose their own eco-friendly products.',
  openGraph: {
    title: 'Gift Cards | Link Flame',
    description:
      'Give the gift of sustainable living with Link Flame gift cards. Perfect for any occasion.',
    type: 'website',
  },
}

export default function GiftCardsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="mb-6 inline-flex items-center justify-center rounded-full bg-green-100 p-4">
          <svg
            className="size-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
            />
          </svg>
        </div>
        <h1 className="mb-4 text-4xl font-bold">Gift Cards</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Give the gift of sustainable living. Our gift cards are perfect for eco-conscious
          friends and family who want to make a positive impact on the planet.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Purchase Section */}
        <div>
          <GiftCardPurchase />
        </div>

        {/* Balance Check Section */}
        <div>
          <GiftCardBalance />

          {/* Quick Link to Full Balance Page */}
          <div className="mt-4 text-center">
            <Link
              href="/gift-cards/check-balance"
              className="text-sm text-green-600 hover:text-green-700 hover:underline"
            >
              Need more details? View full balance page
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="mt-16 rounded-2xl bg-muted p-8">
        <h2 className="mb-8 text-center text-2xl font-bold">
          Why Choose Link Flame Gift Cards?
        </h2>
        <div className="grid gap-6 md:grid-cols-4">
          <div className="text-center">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold">Digital Delivery</h3>
            <p className="text-sm text-muted-foreground">
              Gift cards are delivered instantly via email - no shipping required.
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg
                className="size-6"
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
            <h3 className="mb-2 font-semibold">Valid for 1 Year</h3>
            <p className="text-sm text-muted-foreground">
              Recipients have plenty of time to find the perfect products.
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold">Personalized</h3>
            <p className="text-sm text-muted-foreground">
              Add a personal message to make your gift extra special.
            </p>
          </div>
          <div className="text-center">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-semibold">Support Sustainability</h3>
            <p className="text-sm text-muted-foreground">
              Every purchase supports our mission for a greener planet.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="mb-8 text-center text-2xl font-bold">
          Frequently Asked Questions
        </h2>
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 font-semibold">How do gift cards work?</h3>
            <p className="text-sm text-muted-foreground">
              When you purchase a gift card, you will receive a unique 16-digit code. This code
              can be entered at checkout to apply the gift card balance to any order.
              If the order total is less than the gift card balance, the remaining
              balance stays on the card for future use.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 font-semibold">Do gift cards expire?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, gift cards are valid for 1 year from the date of purchase. You can
              check the expiration date anytime using the balance checker above.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 font-semibold">Can I use multiple gift cards on one order?</h3>
            <p className="text-sm text-muted-foreground">
              Currently, you can apply one gift card per order. If your order total
              exceeds the gift card balance, you can pay the remaining amount with
              any other payment method.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-2 font-semibold">Are gift cards refundable?</h3>
            <p className="text-sm text-muted-foreground">
              Gift card purchases are final and non-refundable. However, if you return
              items purchased with a gift card, the amount will be credited back to
              the gift card balance.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-16 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center text-white">
        <h2 className="mb-4 text-2xl font-bold">
          Give the Gift of Sustainable Living
        </h2>
        <p className="mx-auto mb-6 max-w-xl text-green-100">
          Not sure what to get? A Link Flame gift card lets your loved ones choose
          exactly what they need to live more sustainably.
        </p>
        <a
          href="#top"
          className="inline-flex items-center rounded-full bg-white px-6 py-3 font-semibold text-green-600 transition-colors hover:bg-green-50"
        >
          Purchase a Gift Card
          <svg
            className="ml-2 size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </a>
      </div>
    </div>
  )
}
