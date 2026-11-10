import type { Metadata } from "next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"
import { LIMITS, formatCurrency } from "@/config/constants"
import { SupportLink } from "@/components/legal/SupportLink"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about Link Flame's guides and printed items: downloads, shipping, returns and contact.",
}

export default function FAQPage() {
  return (
    <div className="container py-16">
      <h1 className="mb-8 text-3xl font-bold">Frequently Asked Questions</h1>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>What is Link Flame?</AccordionTrigger>
          <AccordionContent>
            Link Flame is a small shop for low-waste living. We sell our own PDF guides and a couple of
            printed items. We do not resell other brands. Our Checked swaps pages link to the shops of
            other brands. We do not sell or ship those products.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>What do you sell?</AccordionTrigger>
          <AccordionContent>
            Three PDF guides (The Waste Audit Workbook, The One-Swap Kitchen and The Plastic-Free Bathroom
            Field Guide), a bundle of all three called The Swap Starter Set, and two printed items: an organic
            cotton tote and an organic cotton tee.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>How do the digital guides work?</AccordionTrigger>
          <AccordionContent>
            You get your download links on the order confirmation page and by email as soon as payment goes
            through. Each link works for up to 10 downloads, so save the files after you download them.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger>How are the tote and tee made?</AccordionTrigger>
          <AccordionContent>
            They are printed to order by our print partner, Printful, so nothing is made until you order. Items
            usually ship within 2&ndash;5 business days.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
          <AccordionContent>
            We accept major credit cards through our payment processor, Stripe. Your payment information is
            handled by Stripe, and we never store your card details.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6">
          <AccordionTrigger>How much is shipping, and where do you ship?</AccordionTrigger>
          <AccordionContent>
            {"Printed items ship to the United States only, for "}{formatCurrency(5.99)}{" per order. Orders of "}{formatCurrency(LIMITS.freeShippingThreshold)}{" or more ship free. Orders with only digital guides have no shipping charge. Delivery in the U.S. is usually 5–10 business days from the order. See the "}<Link href="/shipping-policy" className="text-primary hover:underline">shipping policy</Link>{"."}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-7">
          <AccordionTrigger>What is your return policy?</AccordionTrigger>
          <AccordionContent>
            Digital guides have a 30-day money-back refund: email us and we refund you. Printed items are made
            to order, so we cannot take them back for size or change of mind. If one arrives misprinted, damaged
            or defective, send us a photo within 30 days of delivery and we will reprint it or refund you. Full
            details are in the <Link href="/return-policy" className="text-primary hover:underline">return policy</Link>.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-8">
          <AccordionTrigger>How can I track my order?</AccordionTrigger>
          <AccordionContent>
            We email you a tracking number when your printed items ship. You can also see your order in your
            account under &ldquo;Order History.&rdquo;
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-9">
          <AccordionTrigger>How do I contact customer support?</AccordionTrigger>
          <AccordionContent>
            You can reach us at <SupportLink className="text-primary hover:underline" />. Or use the{" "}
            <Link href="/contact" className="text-primary hover:underline">contact page</Link>.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
