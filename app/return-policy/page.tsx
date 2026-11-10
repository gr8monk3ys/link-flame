import type { Metadata } from 'next'
import Link from 'next/link'
import { SupportLink } from '@/components/legal/SupportLink'

export const metadata: Metadata = {
  title: 'Return & Refund Policy',
  description:
    'How refunds work for Link Flame digital guides and made-to-order printed items, and how to report a problem.',
}

export default function ReturnPolicyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="mb-2 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl md:leading-10">
        Return &amp; Refund Policy
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: November 8, 2026
      </p>

      <div className="prose prose-lg max-w-none dark:prose-invert">
        <p className="text-muted-foreground">
          Link Flame sells two kinds of things: PDF guides you download, and
          printed items made to order. They are handled differently, so this
          policy covers each in turn.
        </p>

        <h2>Digital Guides: 30-Day Money-Back</h2>
        <p className="text-muted-foreground">
          If a guide is not useful to you, email us within{' '}
          <strong>30 days of your purchase</strong> and we will refund it. You
          do not need to give a reason, and there is nothing to send back.
          This covers the individual guides and the Swap Starter Set bundle.
        </p>

        <h2>Printed Items: Made to Order</h2>
        <p className="text-muted-foreground">
          The tote bag and t-shirt are printed for you after you order, so we
          cannot take them back for a change of mind or a wrong size. Please
          check the size information on the product page before you order.
        </p>
        <p className="text-muted-foreground">
          If your item arrives misprinted, damaged or defective, we will make
          it right with a <strong>free reprint or a refund</strong>, your
          choice. To qualify:
        </p>
        <ul className="text-muted-foreground">
          <li>Email us within <strong>30 days of delivery</strong></li>
          <li>Include your order number and a clear photo of the problem</li>
          <li>You do not need to return the item</li>
        </ul>
        <p className="text-muted-foreground">
          If we sent the wrong item, the same remedy applies.
        </p>

        <h2>How to Ask for a Refund or Reprint</h2>
        <ol className="text-muted-foreground">
          <li>
            Email us at <SupportLink className="text-primary hover:underline" />{' '}
            with your <strong>order number</strong> and what went wrong. For
            printed items, attach a photo.
          </li>
          <li>
            We reply within 1&ndash;2 business days. We may ask a follow-up
            question.
          </li>
          <li>
            We start the refund or send the reprint. Reprints ship at no
            charge.
          </li>
        </ol>

        <h2>Refund Processing</h2>
        <p className="text-muted-foreground">
          Refunds go back to the original payment method. After we approve a
          refund, it can take <strong>5&ndash;10 business days</strong> to
          appear on your statement, depending on your bank or card issuer.
        </p>

        <h2>Lost Packages</h2>
        <p className="text-muted-foreground">
          If tracking shows your package was delivered but you did not receive
          it, or it never arrives, email us. We will look into it with the
          carrier and reprint or refund the order. See the{' '}
          <Link href="/shipping-policy" className="text-primary hover:underline">
            shipping policy
          </Link>{' '}
          for expected delivery times.
        </p>

        <h2>Questions?</h2>
        <p className="text-muted-foreground">
          If you have any questions about refunds, please{' '}
          <Link href="/contact" className="text-primary hover:underline">
            contact us
          </Link>
          {' '}or write to <SupportLink className="text-primary hover:underline" />. We are
          happy to help.
        </p>
      </div>
    </div>
  )
}
