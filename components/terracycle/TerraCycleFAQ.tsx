"use client";

import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TerraCycleFAQProps {
  className?: string;
}

// Question mark icon
const QuestionIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const faqItems = [
  {
    question: "How do I request a free shipping label?",
    answer:
      "Simply log into your Link Flame account, navigate to the TerraCycle section, and click 'Request Shipping Label'. We will email you a prepaid shipping label that you can print and attach to any box. If you do not have an account, you can create one for free to participate in the program.",
  },
  {
    question: "Is there a minimum amount I need to send?",
    answer:
      "There is no minimum requirement to participate. However, to maximize the environmental benefit and reduce shipping emissions, we recommend waiting until you have collected at least 10-15 items before requesting a shipping label. You can use any box you have at home.",
  },
  {
    question: "Do I need to clean the packaging before sending?",
    answer:
      "Yes, please rinse containers to remove any product residue. They do not need to be spotless, but removing excess product helps with the recycling process and prevents issues during shipping. Allow items to dry before packing.",
  },
  {
    question: "How long does it take to process my shipment?",
    answer:
      "Once TerraCycle receives your shipment, it typically takes 2-4 weeks to process. You will receive an email confirmation when your shipment is received and another when it has been processed. Your impact statistics will be updated in your account dashboard.",
  },
  {
    question: "What happens to the packaging I send?",
    answer:
      "TerraCycle sorts items by material type (plastic, metal, glass, etc.). Plastics are cleaned and pelletized to be used as raw material for new products. Metals are melted and reformed. Some items are upcycled directly into new products like playground equipment, park benches, and garden planters.",
  },
  {
    question: "Can I recycle packaging from other brands?",
    answer:
      "This specific program is designed for Link Flame product packaging. However, TerraCycle offers many other recycling programs for various brands and product types. Visit terracycle.com to find programs that accept packaging from other products you use.",
  },
  {
    question: "How do I earn rewards for recycling?",
    answer:
      "Every shipment you send earns you 50 loyalty points automatically added to your account. Additionally, you may be eligible for special promotions, early access to new products, and exclusive discounts as part of our Green Rewards program. Check your account for current offers.",
  },
  {
    question: "What if my packaging is damaged or partially broken?",
    answer:
      "Damaged packaging can still be recycled! As long as the material can be identified (plastic, metal, etc.) and it is not contaminated with hazardous materials, we can process it. Broken glass, however, should be disposed of through your local glass recycling program for safety.",
  },
  {
    question: "Do caps and pumps need to be separated from bottles?",
    answer:
      "No, you can send complete packaging with caps and pumps attached. TerraCycle has the capability to separate different materials during processing. This makes it easy for you - just rinse and pack!",
  },
  {
    question: "Is this program available internationally?",
    answer:
      "Currently, our TerraCycle partnership is available for customers in the United States and Canada. We are actively working to expand the program to additional countries. International customers can check terracycle.com for local programs in their area.",
  },
];

export function TerraCycleFAQ({ className }: TerraCycleFAQProps) {
  return (
    <section className={cn("py-20", className)}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            <QuestionIcon className="size-4" />
            Got Questions?
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Everything you need to know about our TerraCycle recycling program.
            Can not find what you are looking for? Contact our support team.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-gray-200 dark:border-gray-800"
              >
                <AccordionTrigger className="w-full text-left text-gray-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-muted-foreground">
            Still have questions about the program?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Contact our support team
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
