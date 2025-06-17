import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT } from '@/config/constants'

export const metadata: Metadata = {
  title: 'Shipping Policy | Link Flame',
  description:
    'Learn about Link Flame shipping options, delivery times, and service areas for eco-friendly products across the United States and Canada.',
}

export default function ShippingPolicyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="mb-2 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Shipping Policy
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: February 2026
      </p>

      <div className="prose prose-lg max-w-none">
        <p className="text-muted-foreground">
          Thank you for shopping with Link Flame. We are committed to delivering
          your eco-friendly products promptly and safely. This policy outlines
          our shipping options, costs, and delivery expectations.
        </p>

        <h2>Service Areas</h2>
        <p className="text-muted-foreground">
          We currently ship to addresses within the <strong>United States</strong> and{' '}
          <strong>Canada</strong>. We do not offer international shipping to
          other countries at this time. If you are located outside of these
          regions, please check back as we plan to expand our shipping coverage
          in the future.
        </p>

        <h2>Shipping Options</h2>

        <h3>Standard Shipping</h3>
        <ul className="text-muted-foreground">
          <li>
            <strong>Delivery time:</strong> 5&ndash;7 business days
          </li>
          <li>
            <strong>Cost:</strong> $5.99 per order
          </li>
          <li>
            <strong>Free shipping</strong> on orders over $75
          </li>
          <li>Available to all U.S. and Canadian addresses, including P.O. boxes and APO/FPO addresses</li>
        </ul>

        <h3>Express Shipping</h3>
        <ul className="text-muted-foreground">
          <li>
            <strong>Delivery time:</strong> 2&ndash;3 business days
          </li>
          <li>
            <strong>Cost:</strong> $14.99 per order
          </li>
          <li>
            Available to standard U.S. and Canadian street addresses only (not
            available for P.O. boxes or APO/FPO addresses)
          </li>
        </ul>

        <h2>Order Processing</h2>
        <p className="text-muted-foreground">
          All orders are processed within <strong>1&ndash;2 business days</strong> after
          payment confirmation. Orders placed on weekends or holidays will be
          processed on the next business day. During peak seasons or promotional
          events, processing times may be slightly longer.
        </p>

        <h2>Order Tracking</h2>
        <p className="text-muted-foreground">
          Once your order has shipped, you will receive a confirmation email with
          a tracking number and a link to track your package. You can also view
          your order status and tracking information by logging into your account
          and visiting your{' '}
          <Link href="/account" className="text-primary hover:underline">
            order history
          </Link>
          .
        </p>

        <h2>Delivery Expectations</h2>
        <p className="text-muted-foreground">
          Delivery times listed above are estimates and begin from the date your
          order ships, not from the date the order is placed. Business days are
          Monday through Friday, excluding federal holidays.
        </p>
        <p className="text-muted-foreground">
          Please note that Link Flame is not responsible for delays caused by
          shipping carriers, weather conditions, natural disasters, customs
          processing (for Canadian shipments), or other circumstances beyond our
          control. If your package is significantly delayed, please contact us
          and we will do our best to assist you.
        </p>

        <h2>Shipping to P.O. Boxes and APO/FPO Addresses</h2>
        <p className="text-muted-foreground">
          We accept P.O. box and APO/FPO addresses for <strong>standard shipping only</strong>.
          Express shipping is not available to these address types. Delivery to
          APO/FPO addresses may take longer than the standard estimated delivery
          window.
        </p>

        <h2>Incorrect or Incomplete Addresses</h2>
        <p className="text-muted-foreground">
          Please double-check your shipping address before completing your order.
          Link Flame is not responsible for packages delivered to incorrect
          addresses provided by the customer. If a package is returned to us due
          to an incorrect address, we will contact you to arrange reshipment. Additional
          shipping charges may apply.
        </p>

        <h2>Damaged or Lost Packages</h2>
        <p className="text-muted-foreground">
          If your package arrives damaged or is lost in transit, please contact
          us within 7 days of the expected delivery date. We will work with the
          shipping carrier to resolve the issue and, where appropriate, send a
          replacement or issue a refund.
        </p>

        <h2>Contact Us</h2>
        <p className="text-muted-foreground">
          If you have any questions about shipping or need help with your order,
          please reach out to our support team at{' '}
          <a
            href={`mailto:${CONTACT.supportEmail}`}
            className="text-primary hover:underline"
          >
            {CONTACT.supportEmail}
          </a>
          . We are happy to help.
        </p>
      </div>
    </div>
  )
}
