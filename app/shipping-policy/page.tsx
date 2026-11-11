import type { Metadata } from 'next'
import Link from 'next/link'
import { LIMITS, formatCurrency } from '@/config/constants'
import { SupportLink } from '@/components/legal/SupportLink'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description:
    'Learn about Link Flame shipping options, delivery times, and and service area for digital guides and printed items.',
}

export default function ShippingPolicyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="mb-2 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl md:leading-10">
        Shipping Policy
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: November 8, 2026
      </p>

      <div className="prose prose-lg max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          Link Flame sells PDF guides, which download instantly, and two printed
          items made to order. This policy explains how each is delivered, what
          it costs, and how long it takes.
        </p>

        <h2>Digital Guides</h2>
        <p className="text-muted-foreground">
          Our PDF guides are delivered instantly. As soon as your payment goes
          through, your download links appear on the order confirmation page
          and arrive by email. Each link works for up to 10 downloads. Digital
          items have no shipping cost, and an order that contains only guides
          has no shipping charge.
        </p>

        <h2>Printed Items</h2>
        <p className="text-muted-foreground">
          <strong>Printed items are not for sale right now.</strong> This
          section applies to orders placed earlier and if they come back.
          Our tote bag and t-shirt are printed to order by our print partner,
          Printful. Nothing is sitting in a warehouse waiting for you, which
          is why there is a production step before shipping.
        </p>
        <ul className="text-muted-foreground">
          <li>
            <strong>Production:</strong> usually ships within 2&ndash;5
            business days of your order
          </li>
          <li>
            <strong>Delivery in the U.S.:</strong> usually 5&ndash;10 business
            days from the date you order
          </li>
        </ul>

        <h2>Service Areas</h2>
        <p className="text-muted-foreground">
          We ship printed items to addresses within the <strong>United States</strong> only.
          We do not ship to other countries at this time. Digital guides can be downloaded from anywhere.
        </p>

        <h2>Shipping Cost</h2>
        <ul className="text-muted-foreground">
          <li>
            <strong>Standard shipping:</strong> {formatCurrency(5.99)} per order
          </li>
          <li>
            <strong>Free shipping</strong> on orders of{' '}
            {formatCurrency(LIMITS.freeShippingThreshold)} or more
          </li>
          <li>Digital-only orders have no shipping charge</li>
        </ul>
        <p className="text-muted-foreground">
          We offer one shipping speed. There is no express option.
        </p>

        <h2>Order Tracking</h2>
        <p className="text-muted-foreground">
          Once your printed items have shipped, we email you a tracking number and a link to track your package. You can also view
          your order status and tracking information by logging into your account
          and visiting your{' '}
          <Link href="/account" className="text-primary hover:underline">
            order history
          </Link>
          .
        </p>

        <h2>Delivery Expectations</h2>
        <p className="text-muted-foreground">
          Delivery times listed above are estimates, not guarantees. Business days
          are Monday through Friday, excluding federal holidays.
        </p>
        <p className="text-muted-foreground">
          Please note that Link Flame is not responsible for delays caused by
          shipping carriers, weather conditions, natural disasters, or other circumstances beyond our
          control. If your package is significantly delayed, please contact us
          and we will do our best to assist you.
        </p>

        <h2>Incorrect or Incomplete Addresses</h2>
        <p className="text-muted-foreground">
          Please double-check your shipping address before completing your order.
          Link Flame is not responsible for packages delivered to incorrect
          addresses provided by the customer. If a package is returned to us due
          to us or the print partner because of an incorrect address, we will contact you to
          arrange reshipment. Additional shipping charges may apply.
        </p>

        <h2>Damaged or Lost Packages</h2>
        <p className="text-muted-foreground">
          If a printed item arrives damaged, misprinted or defective, or your
          package is lost in transit, email us within 30 days of delivery (or
          of the expected delivery date, for a lost package) with a photo where
          one applies. We will reprint and reship it or refund you. See the{' '}
          <Link href="/return-policy" className="text-primary hover:underline">
            return policy
          </Link>
          .
        </p>

        <h2>Contact Us</h2>
        <p className="text-muted-foreground">
          If you have any questions about shipping or need help with your order,
          please reach out to our support team at{' '}
          <SupportLink className="text-primary hover:underline" />
          . We are happy to help.
        </p>
      </div>
    </div>
  )
}
