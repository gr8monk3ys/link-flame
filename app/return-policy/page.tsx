import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT } from '@/config/constants'

export const metadata: Metadata = {
  title: 'Return & Refund Policy | Link Flame',
  description:
    'Learn about Link Flame return windows, refund processing, exchanges, and how to initiate a return for eco-friendly products.',
}

export default function ReturnPolicyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="mb-2 text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Return &amp; Refund Policy
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: February 2026
      </p>

      <div className="prose prose-lg max-w-none">
        <p className="text-muted-foreground">
          At Link Flame, we want you to be completely satisfied with your
          purchase. If something is not right, we are here to help. Please
          review our return and refund policy below.
        </p>

        <h2>30-Day Return Window</h2>
        <p className="text-muted-foreground">
          You may return most items within <strong>30 days of the delivery date</strong> for
          a full refund. To be eligible for a return, items must be:
        </p>
        <ul className="text-muted-foreground">
          <li>Unused and in the same condition as when you received them</li>
          <li>In their original packaging with all tags and labels attached</li>
          <li>Accompanied by proof of purchase (order number or receipt)</li>
        </ul>

        <h2>Non-Returnable Items</h2>
        <p className="text-muted-foreground">
          For health, safety, and hygiene reasons, the following items cannot be
          returned once opened or used:
        </p>
        <ul className="text-muted-foreground">
          <li>
            <strong>Personal care products</strong> (skincare, haircare, oral
            care) that have been opened or used
          </li>
          <li>
            <strong>Food and beverage items</strong> (teas, snacks, supplements)
          </li>
          <li>
            <strong>Gift cards</strong> and digital products
          </li>
          <li>
            <strong>Final sale items</strong> marked as non-returnable at the
            time of purchase
          </li>
        </ul>
        <p className="text-muted-foreground">
          If you receive a non-returnable item that is defective or damaged,
          please contact us immediately and we will make it right.
        </p>

        <h2>How to Initiate a Return</h2>
        <p className="text-muted-foreground">
          To start a return, please follow these steps:
        </p>
        <ol className="text-muted-foreground">
          <li>
            Email our support team at{' '}
            <a
              href={`mailto:${CONTACT.supportEmail}`}
              className="text-primary hover:underline"
            >
              {CONTACT.supportEmail}
            </a>{' '}
            with your <strong>order number</strong> and a brief description of
            the reason for the return.
          </li>
          <li>
            Our team will review your request and respond within 1&ndash;2
            business days with return instructions, including the return
            shipping address.
          </li>
          <li>
            Package the item securely in its original packaging and ship it to
            the provided address.
          </li>
          <li>
            Once we receive and inspect the returned item, we will process your
            refund.
          </li>
        </ol>

        <h2>Return Shipping Costs</h2>
        <p className="text-muted-foreground">
          <strong>Standard returns:</strong> Return shipping costs are the
          responsibility of the customer. We recommend using a trackable
          shipping method to ensure your return arrives safely.
        </p>
        <p className="text-muted-foreground">
          <strong>Defective or incorrect items:</strong> If you received a
          defective, damaged, or incorrect item, Link Flame will cover the
          return shipping cost. Please contact us and we will provide a prepaid
          return label.
        </p>

        <h2>Refund Processing</h2>
        <p className="text-muted-foreground">
          Once we receive your returned item and verify it meets our return
          conditions, your refund will be processed within{' '}
          <strong>5&ndash;7 business days</strong>. Refunds are issued to the
          original payment method used at checkout.
        </p>
        <p className="text-muted-foreground">
          Please note that it may take an additional 3&ndash;5 business days for
          the refund to appear on your bank or credit card statement, depending
          on your financial institution.
        </p>

        <h2>Defective or Damaged Items</h2>
        <p className="text-muted-foreground">
          If you receive an item that is defective, damaged during shipping, or
          materially different from what was described, please contact us within
          7 days of delivery. We will provide:
        </p>
        <ul className="text-muted-foreground">
          <li>A full refund, including any return shipping costs</li>
          <li>Or a replacement item at no additional charge</li>
        </ul>
        <p className="text-muted-foreground">
          We may ask you to provide photos of the defective or damaged item to
          help us improve our quality control and packaging processes.
        </p>

        <h2>Exchanges</h2>
        <p className="text-muted-foreground">
          If you would like to exchange an item for a different size, color, or
          variant, please contact our support team at{' '}
          <a
            href={`mailto:${CONTACT.supportEmail}`}
            className="text-primary hover:underline"
          >
            {CONTACT.supportEmail}
          </a>
          . Exchanges are subject to product availability. If the desired item
          is out of stock, we will process a refund for the returned item
          instead.
        </p>

        <h2>Late or Missing Refunds</h2>
        <p className="text-muted-foreground">
          If you have not received your refund within the expected timeframe,
          please:
        </p>
        <ol className="text-muted-foreground">
          <li>Check your bank or credit card statement again.</li>
          <li>Contact your credit card company or bank, as processing times can vary.</li>
          <li>
            If you have done both and still have not received your refund,
            please contact us at{' '}
            <a
              href={`mailto:${CONTACT.supportEmail}`}
              className="text-primary hover:underline"
            >
              {CONTACT.supportEmail}
            </a>
            .
          </li>
        </ol>

        <h2>Questions?</h2>
        <p className="text-muted-foreground">
          If you have any questions about returns or refunds, please do not
          hesitate to{' '}
          <Link href="/contact" className="text-primary hover:underline">
            contact us
          </Link>{' '}
          or email{' '}
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
