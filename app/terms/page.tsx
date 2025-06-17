import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT } from '@/config/constants'

export const metadata: Metadata = {
  title: 'Terms of Service | Link Flame',
  description:
    'Read the Link Flame terms of service covering purchases, payments, shipping, returns, intellectual property, and dispute resolution.',
}

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="mb-2 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Terms of Service
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: February 2026
      </p>

      <div className="prose prose-lg max-w-none">
        <p className="text-muted-foreground">
          Welcome to Link Flame. By accessing or using our website at
          linkflame.com, creating an account, or making a purchase, you agree to
          be bound by these Terms of Service. Please read them carefully before
          using our platform. If you do not agree with these terms, please do
          not use our website.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p className="text-muted-foreground">
          By accessing and using this website, you accept and agree to be bound
          by these Terms of Service, our{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          , our{' '}
          <Link href="/return-policy" className="text-primary hover:underline">
            Return Policy
          </Link>
          , and our{' '}
          <Link href="/shipping-policy" className="text-primary hover:underline">
            Shipping Policy
          </Link>
          , which are incorporated by reference. We reserve the right to update
          these terms at any time. Continued use of the website after changes
          constitutes acceptance of the revised terms.
        </p>

        <h2>2. Account Registration</h2>
        <p className="text-muted-foreground">
          To make a purchase, you may need to create an account. You are
          responsible for:
        </p>
        <ul className="text-muted-foreground">
          <li>Providing accurate and complete registration information</li>
          <li>Maintaining the confidentiality of your password</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized use of your account</li>
        </ul>
        <p className="text-muted-foreground">
          You must be at least 18 years of age or the age of majority in your
          jurisdiction to create an account and make purchases on Link Flame. We
          reserve the right to suspend or terminate accounts that violate these
          terms.
        </p>

        <h2>3. Products and Pricing</h2>
        <p className="text-muted-foreground">
          All product prices on Link Flame are listed in <strong>United
          States Dollars (USD)</strong> and are subject to change without prior
          notice. We strive to display accurate pricing, but errors may occur.
          If we discover a pricing error after you have placed an order, we will
          notify you and give you the option to confirm or cancel your order at
          the corrected price.
        </p>
        <p className="text-muted-foreground">
          <strong>Tax:</strong> Applicable sales tax is calculated and added at
          checkout based on your shipping address and applicable state and local
          tax laws.
        </p>
        <p className="text-muted-foreground">
          <strong>Product descriptions:</strong> We make every effort to
          describe and display our products accurately, including colors,
          materials, and dimensions. However, we do not warrant that product
          descriptions, photographs, or other content on our website are
          completely accurate, error-free, or current. Due to variations in
          monitors and screens, actual product colors may differ slightly from
          what is displayed on your device.
        </p>

        <h2>4. Orders and Payment</h2>
        <p className="text-muted-foreground">
          When you place an order, you are making an offer to purchase. We
          reserve the right to accept or decline any order at our sole
          discretion. We may refuse or cancel orders for reasons including, but
          not limited to:
        </p>
        <ul className="text-muted-foreground">
          <li>Product unavailability or insufficient inventory</li>
          <li>Errors in pricing or product information</li>
          <li>Suspected fraudulent or unauthorized transactions</li>
          <li>Orders that exceed reasonable purchase quantities</li>
          <li>Inability to verify payment or shipping information</li>
        </ul>
        <p className="text-muted-foreground">
          If we cancel your order after payment has been processed, we will
          issue a full refund to your original payment method.
        </p>
        <p className="text-muted-foreground">
          <strong>Payment processing:</strong> All payments are processed
          securely by{' '}
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Stripe
          </a>
          . We accept major credit and debit cards, including Visa, Mastercard,
          American Express, and Discover. Link Flame never stores your full
          credit card number, expiration date, or security code on our servers.
          All payment data is handled in accordance with PCI DSS standards.
        </p>

        <h2>5. Shipping and Delivery</h2>
        <p className="text-muted-foreground">
          Shipping terms, costs, and estimated delivery times are detailed in
          our{' '}
          <Link href="/shipping-policy" className="text-primary hover:underline">
            Shipping Policy
          </Link>
          . By placing an order, you agree to the terms outlined in that policy.
          Risk of loss and title for items pass to you upon delivery to the
          carrier.
        </p>

        <h2>6. Returns and Refunds</h2>
        <p className="text-muted-foreground">
          Our return and refund terms are detailed in our{' '}
          <Link href="/return-policy" className="text-primary hover:underline">
            Return &amp; Refund Policy
          </Link>
          . By making a purchase, you agree to the terms outlined in that
          policy.
        </p>

        <h2>7. User Content</h2>
        <p className="text-muted-foreground">
          By posting content on our site, including product reviews, comments,
          and other submissions, you grant Link Flame a non-exclusive,
          royalty-free, worldwide, perpetual license to use, modify, reproduce,
          distribute, and display that content in connection with our services.
        </p>
        <p className="text-muted-foreground">
          You agree that your content will not:
        </p>
        <ul className="text-muted-foreground">
          <li>Contain false, misleading, or defamatory statements</li>
          <li>Infringe on any third party&apos;s intellectual property rights</li>
          <li>Contain unlawful, threatening, abusive, or harassing material</li>
          <li>Include personal information of other individuals without their consent</li>
          <li>Contain spam, advertisements, or solicitations</li>
        </ul>
        <p className="text-muted-foreground">
          We reserve the right to remove any content that violates these terms
          or that we deem inappropriate at our sole discretion.
        </p>

        <h2>8. Intellectual Property</h2>
        <p className="text-muted-foreground">
          All content on this website, including but not limited to text,
          graphics, logos, images, product descriptions, blog posts, and
          software, is the property of Link Flame or its content suppliers and
          is protected by United States and international copyright,
          trademark, and other intellectual property laws.
        </p>
        <p className="text-muted-foreground">
          You may not reproduce, distribute, modify, create derivative works
          from, publicly display, or otherwise use any of our content without
          prior written permission from Link Flame, except for personal,
          non-commercial use such as viewing products and placing orders.
        </p>

        <h2>9. Disclaimer of Warranties</h2>
        <p className="text-muted-foreground">
          Our website and products are provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. Link Flame makes no warranties, expressed or
          implied, including but not limited to implied warranties of
          merchantability, fitness for a particular purpose, or
          non-infringement. We do not warrant that:
        </p>
        <ul className="text-muted-foreground">
          <li>Our website will be available at all times or free from errors</li>
          <li>Product descriptions or photographs are completely accurate</li>
          <li>Defects in our website or services will be corrected</li>
          <li>Our website is free of viruses or other harmful components</li>
        </ul>

        <h2>10. Limitation of Liability</h2>
        <p className="text-muted-foreground">
          To the fullest extent permitted by applicable law, Link Flame and its
          officers, directors, employees, and affiliates shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages,
          including but not limited to loss of profits, data, use, goodwill, or
          other intangible losses, resulting from:
        </p>
        <ul className="text-muted-foreground">
          <li>Your access to or use of (or inability to access or use) our website</li>
          <li>Any conduct or content of any third party on our website</li>
          <li>Any products purchased through our platform</li>
          <li>Unauthorized access, use, or alteration of your data</li>
        </ul>
        <p className="text-muted-foreground">
          In no event shall our total liability exceed the amount you paid to
          Link Flame in the twelve (12) months preceding the event giving rise
          to the claim.
        </p>

        <h2>11. Indemnification</h2>
        <p className="text-muted-foreground">
          You agree to indemnify, defend, and hold harmless Link Flame and its
          officers, directors, employees, and affiliates from and against any
          claims, damages, losses, liabilities, costs, and expenses (including
          reasonable attorneys&apos; fees) arising from your use of our website,
          violation of these terms, or infringement of any third party&apos;s rights.
        </p>

        <h2>12. Dispute Resolution</h2>
        <p className="text-muted-foreground">
          If you have a dispute with Link Flame, we encourage you to contact us
          first at{' '}
          <a
            href={`mailto:${CONTACT.supportEmail}`}
            className="text-primary hover:underline"
          >
            {CONTACT.supportEmail}
          </a>{' '}
          so we can attempt to resolve the issue informally.
        </p>
        <p className="text-muted-foreground">
          If the dispute cannot be resolved informally within 30 days, you agree
          that it shall be settled by <strong>binding arbitration</strong> in
          accordance with the rules of the American Arbitration Association
          (AAA). The arbitration shall take place in the State of California,
          and the arbitrator&apos;s decision shall be final and binding.
        </p>
        <p className="text-muted-foreground">
          You agree to waive any right to participate in a class action lawsuit
          or class-wide arbitration against Link Flame.
        </p>

        <h2>13. Governing Law</h2>
        <p className="text-muted-foreground">
          These Terms of Service and any disputes arising from them are governed
          by and construed in accordance with the laws of the{' '}
          <strong>State of California</strong>, United States of America,
          without regard to its conflict of law provisions.
        </p>

        <h2>14. Severability</h2>
        <p className="text-muted-foreground">
          If any provision of these terms is found to be unenforceable or
          invalid by a court of competent jurisdiction, that provision shall be
          limited or eliminated to the minimum extent necessary so that the
          remaining provisions remain in full force and effect.
        </p>

        <h2>15. Changes to Terms</h2>
        <p className="text-muted-foreground">
          Link Flame may revise these Terms of Service at any time. When we make
          material changes, we will update the &quot;Last updated&quot; date at the top
          of this page. We may also notify you by email or through a notice on
          our website. Your continued use of the website after changes are
          posted constitutes acceptance of the revised terms.
        </p>

        <h2>16. Contact Us</h2>
        <p className="text-muted-foreground">
          If you have any questions about these Terms of Service, please contact
          us:
        </p>
        <ul className="text-muted-foreground">
          <li>
            <strong>Email:</strong>{' '}
            <a
              href={`mailto:${CONTACT.supportEmail}`}
              className="text-primary hover:underline"
            >
              {CONTACT.supportEmail}
            </a>
          </li>
          <li>
            <strong>Contact form:</strong>{' '}
            <Link href="/contact" className="text-primary hover:underline">
              linkflame.com/contact
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
