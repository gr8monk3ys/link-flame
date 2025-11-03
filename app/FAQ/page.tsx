import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CONTACT } from "@/config/constants"

export default function FAQPage() {
  return (
    <div className="container py-16">
      <h1 className="mb-8 text-3xl font-bold">Frequently Asked Questions</h1>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>What is Link Flame?</AccordionTrigger>
          <AccordionContent>
            Link Flame is a modern e-commerce platform that offers a curated selection of high-quality products. 
            We focus on providing a seamless shopping experience with secure payments and reliable delivery.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2">
          <AccordionTrigger>How do I place an order?</AccordionTrigger>
          <AccordionContent>
            Placing an order is easy! Simply browse our collections, add items to your cart, and proceed to checkout. 
            You&apos;ll need to create an account or sign in, then follow the steps to complete your purchase securely 
            using your preferred payment method.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3">
          <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
          <AccordionContent>
            We accept all major credit cards through our secure payment processor, Stripe. Your payment information 
            is encrypted and processed securely, and we never store your card details.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4">
          <AccordionTrigger>What is your return policy?</AccordionTrigger>
          <AccordionContent>
            We offer a 30-day return policy for all unused items in their original packaging. If you&apos;re not 
            satisfied with your purchase, contact our customer service team to initiate a return. Once we receive 
            the returned item, we&apos;ll process your refund within 5-7 business days.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5">
          <AccordionTrigger>How can I track my order?</AccordionTrigger>
          <AccordionContent>
            Once your order ships, you&apos;ll receive a confirmation email with tracking information. You can also 
            view your order status and tracking details in your account dashboard under &quot;Order History.&quot;
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6">
          <AccordionTrigger>Do you ship internationally?</AccordionTrigger>
          <AccordionContent>
            Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location. You can 
            see the exact shipping cost for your location during checkout before completing your purchase.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-7">
          <AccordionTrigger>How do I contact customer support?</AccordionTrigger>
          <AccordionContent>
            Our customer support team is available via email at {CONTACT.supportEmail} or through our contact form.
            We aim to respond to all inquiries within 24 hours during business days.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}