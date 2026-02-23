import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT } from '@/config/constants'

export const metadata: Metadata = {
  title: 'Privacy Policy | Link Flame',
  description:
    'Learn how Link Flame collects, uses, and protects your personal information when you shop for eco-friendly products on our platform.',
}

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="mb-2 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Privacy Policy
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: February 2026
      </p>

      <div className="prose prose-lg max-w-none">
        <p className="text-muted-foreground">
          At Link Flame, we take your privacy seriously. This Privacy Policy
          explains how we collect, use, share, and protect your personal
          information when you visit our website, create an account, or make a
          purchase. By using our platform, you agree to the practices described
          in this policy.
        </p>

        <h2>1. Information We Collect</h2>

        <h3>Information You Provide</h3>
        <p className="text-muted-foreground">
          We collect information you voluntarily provide when you:
        </p>
        <ul className="text-muted-foreground">
          <li>
            <strong>Create an account:</strong> name, email address, and
            password
          </li>
          <li>
            <strong>Place an order:</strong> shipping address, billing address,
            and phone number
          </li>
          <li>
            <strong>Make a payment:</strong> payment information (credit card
            numbers, expiration dates, and security codes are processed directly
            by Stripe and are never stored on our servers)
          </li>
          <li>
            <strong>Contact us:</strong> any information you include in support
            emails or contact form submissions
          </li>
          <li>
            <strong>Subscribe to our newsletter:</strong> email address and
            communication preferences
          </li>
          <li>
            <strong>Leave a review or comment:</strong> review content, ratings,
            and associated account information
          </li>
        </ul>

        <h3>Information Collected Automatically</h3>
        <p className="text-muted-foreground">
          When you visit our website, we automatically collect certain
          information, including:
        </p>
        <ul className="text-muted-foreground">
          <li>
            <strong>Browsing behavior:</strong> pages viewed, products browsed,
            search queries, and time spent on pages
          </li>
          <li>
            <strong>Device information:</strong> browser type, operating system,
            screen resolution, and device identifiers
          </li>
          <li>
            <strong>Network information:</strong> IP address and approximate
            geographic location
          </li>
          <li>
            <strong>Referral data:</strong> the website or link that directed
            you to our platform
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p className="text-muted-foreground">
          We use your personal information for the following purposes:
        </p>
        <ul className="text-muted-foreground">
          <li>
            <strong>Order fulfillment:</strong> processing your orders, charging
            payment, and arranging shipping and delivery
          </li>
          <li>
            <strong>Shipping notifications:</strong> sending order confirmation,
            shipping updates, and delivery notifications via email
          </li>
          <li>
            <strong>Customer support:</strong> responding to your questions,
            processing returns and refunds, and resolving issues
          </li>
          <li>
            <strong>Product recommendations:</strong> personalizing your
            shopping experience based on your browsing and purchase history
          </li>
          <li>
            <strong>Account management:</strong> maintaining your account,
            order history, and saved preferences
          </li>
          <li>
            <strong>Marketing communications:</strong> sending newsletters,
            promotional offers, and product updates (with your consent; you can
            unsubscribe at any time)
          </li>
          <li>
            <strong>Platform improvement:</strong> analyzing usage patterns to
            improve our website, products, and services
          </li>
          <li>
            <strong>Fraud prevention:</strong> detecting and preventing
            fraudulent transactions and unauthorized access
          </li>
          <li>
            <strong>Legal compliance:</strong> meeting tax, accounting, and
            regulatory obligations
          </li>
        </ul>

        <h2>3. Third-Party Service Providers</h2>
        <p className="text-muted-foreground">
          We share your information with trusted third-party service providers
          who help us operate our platform. These providers are contractually
          obligated to protect your data and use it only for the purposes we
          specify:
        </p>
        <ul className="text-muted-foreground">
          <li>
            <strong>Stripe</strong> (payment processing): processes your credit
            card and payment information securely. Link Flame never stores your
            full card numbers. See{' '}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Stripe&apos;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Shipping carriers</strong> (order delivery): we share your
            name, shipping address, and phone number with carriers to deliver
            your orders.
          </li>
          <li>
            <strong>Resend</strong> (email communications): sends transactional
            emails such as order confirmations, shipping updates, and password
            resets on our behalf.
          </li>
          <li>
            <strong>Vercel</strong> (website hosting): hosts our website and
            processes web requests. See{' '}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Vercel&apos;s Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong>Sentry</strong> (error monitoring): collects technical error
            data to help us identify and fix bugs. This may include device
            information and anonymized usage data, but does not include your
            personal details or payment information.
          </li>
          <li>
            <strong>Neon</strong> (database hosting): securely stores account
            and order data in our PostgreSQL database.
          </li>
        </ul>
        <p className="text-muted-foreground">
          We do not sell, rent, or trade your personal information to third
          parties for marketing purposes.
        </p>

        <h2>4. Cookies and Tracking Technologies</h2>
        <p className="text-muted-foreground">
          We use cookies and similar technologies to provide and improve our
          services. Here is what we use:
        </p>

        <h3>Essential Cookies (Required)</h3>
        <p className="text-muted-foreground">
          These cookies are necessary for the website to function and cannot be
          disabled:
        </p>
        <ul className="text-muted-foreground">
          <li>
            <strong>Session cookie:</strong> keeps you logged in during your
            visit
          </li>
          <li>
            <strong>Cart cookie:</strong> preserves your shopping cart between
            visits (30-day expiry for guest users)
          </li>
          <li>
            <strong>CSRF token:</strong> protects against cross-site request
            forgery attacks
          </li>
        </ul>

        <h3>Analytics Cookies (Optional)</h3>
        <p className="text-muted-foreground">
          With your consent, we may use analytics cookies to understand how
          visitors use our site. These cookies collect aggregated, anonymous
          data. You can opt out of analytics cookies through your browser
          settings.
        </p>

        <h2>5. Data Retention</h2>
        <p className="text-muted-foreground">
          We retain your information for as long as necessary to provide our
          services and fulfill the purposes described in this policy:
        </p>
        <ul className="text-muted-foreground">
          <li>
            <strong>Account data</strong> (name, email, preferences): retained
            until you request account deletion
          </li>
          <li>
            <strong>Order records</strong> (transaction details, invoices):
            retained for 7 years after the transaction date, as required for tax
            and accounting purposes
          </li>
          <li>
            <strong>Shipping addresses:</strong> retained with your account for
            convenience; deleted upon account deletion
          </li>
          <li>
            <strong>Support correspondence:</strong> retained for up to 3 years
            to provide consistent support
          </li>
          <li>
            <strong>Analytics data:</strong> retained in aggregated,
            anonymized form indefinitely
          </li>
        </ul>

        <h2>6. Data Security</h2>
        <p className="text-muted-foreground">
          We implement industry-standard security measures to protect your
          personal information, including:
        </p>
        <ul className="text-muted-foreground">
          <li>HTTPS encryption for all data transmitted between your browser and our servers</li>
          <li>Bcrypt hashing for passwords (we never store passwords in plain text)</li>
          <li>CSRF protection on all form submissions and API mutations</li>
          <li>Rate limiting to prevent brute-force attacks</li>
          <li>Secure, httpOnly cookies to prevent cross-site scripting access</li>
          <li>PCI-compliant payment processing through Stripe (we never handle or store raw card data)</li>
        </ul>
        <p className="text-muted-foreground">
          While we take reasonable precautions, no method of electronic
          transmission or storage is completely secure. We cannot guarantee
          absolute security of your data.
        </p>

        <h2>7. Your Rights</h2>
        <p className="text-muted-foreground">
          You have the following rights regarding your personal information:
        </p>
        <ul className="text-muted-foreground">
          <li>
            <strong>Access:</strong> request a copy of the personal information
            we hold about you
          </li>
          <li>
            <strong>Correction:</strong> request that we correct inaccurate or
            incomplete information
          </li>
          <li>
            <strong>Deletion:</strong> request that we delete your account and
            personal data (subject to legal retention requirements for order
            records)
          </li>
          <li>
            <strong>Opt out of marketing:</strong> unsubscribe from promotional
            emails at any time using the link in each email
          </li>
          <li>
            <strong>Data portability:</strong> request your data in a
            machine-readable format
          </li>
        </ul>
        <p className="text-muted-foreground">
          To exercise any of these rights, please email us at{' '}
          <a
            href={`mailto:${CONTACT.supportEmail}`}
            className="text-primary hover:underline"
          >
            {CONTACT.supportEmail}
          </a>
          . We will respond to your request within 30 days.
        </p>

        <h2>8. California Consumer Privacy Act (CCPA) Notice</h2>
        <p className="text-muted-foreground">
          If you are a California resident, you have additional rights under the
          California Consumer Privacy Act (CCPA):
        </p>
        <ul className="text-muted-foreground">
          <li>
            <strong>Right to know:</strong> you can request details about the
            categories and specific pieces of personal information we have
            collected about you, the sources of that information, our business
            purposes for collecting it, and the categories of third parties with
            whom we share it.
          </li>
          <li>
            <strong>Right to delete:</strong> you can request deletion of your
            personal information, subject to certain exceptions (such as
            completing a transaction or meeting legal obligations).
          </li>
          <li>
            <strong>Right to opt out of sale:</strong> Link Flame does not sell
            your personal information. We do not and will not sell your data to
            third parties.
          </li>
          <li>
            <strong>Right to non-discrimination:</strong> we will not
            discriminate against you for exercising your CCPA rights.
          </li>
        </ul>
        <p className="text-muted-foreground">
          To submit a CCPA request, please email{' '}
          <a
            href={`mailto:${CONTACT.supportEmail}`}
            className="text-primary hover:underline"
          >
            {CONTACT.supportEmail}
          </a>{' '}
          with the subject line &quot;CCPA Request.&quot; We may need to verify
          your identity before processing your request.
        </p>

        <h2>9. Children&apos;s Privacy</h2>
        <p className="text-muted-foreground">
          Our website and services are not intended for children under 13 years
          of age. We do not knowingly collect personal information from children
          under 13. If we become aware that we have collected data from a child
          under 13, we will take steps to delete that information promptly. If
          you believe a child has provided us with personal information, please
          contact us at{' '}
          <a
            href={`mailto:${CONTACT.supportEmail}`}
            className="text-primary hover:underline"
          >
            {CONTACT.supportEmail}
          </a>
          .
        </p>

        <h2>10. Changes to This Policy</h2>
        <p className="text-muted-foreground">
          We may update this Privacy Policy from time to time to reflect changes
          in our practices, technology, or legal requirements. When we make
          material changes, we will update the &quot;Last updated&quot; date at the top
          of this page and, where appropriate, notify you by email or through a
          notice on our website. We encourage you to review this policy
          periodically.
        </p>

        <h2>11. Contact Us</h2>
        <p className="text-muted-foreground">
          If you have any questions, concerns, or requests regarding this
          Privacy Policy or our data practices, please contact us:
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
