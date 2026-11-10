import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Sustainability Commitment",
  description:
    "What Link Flame does today to keep waste down, and the goals we are working toward but have not reached.",
  openGraph: {
    title: "Our Sustainability Commitment",
    description:
      "Measured, not promised: what is true today and what we are still working toward.",
  },
};

const today = [
  {
    title: "Most of the catalogue is digital",
    description:
      "Our three guides and the Swap Starter Set bundle are PDFs. Nothing is packed, shipped or stored for them.",
  },
  {
    title: "Printed items are made to order",
    description:
      "The tote and tee are printed by Printful after you order. We do not hold stock that may never sell.",
  },
  {
    title: "Organic cotton",
    description:
      "The tote and the tee are made of organic cotton. We do not hold an organic certification of our own.",
  },
  {
    title: "Our own products only",
    description:
      "We write the guides and design the printed goods. We do not resell other brands.",
  },
];

const goals = [
  {
    title: "Give 1% of sales",
    description:
      "We want to join 1% for the Planet once the shop has revenue to give. We are not a member, and we have not given anything yet.",
  },
  {
    title: "Offset or cut shipping emissions",
    description:
      "Shipping is not carbon-neutral today. We want to look at offsets or lower-impact shipping when we can do it properly.",
  },
  {
    title: "Plastic-free shipping",
    description:
      "We do not control how Printful packs printed items, so we cannot promise plastic-free packaging. We want to find out what is possible and report back.",
  },
  {
    title: "Certifications",
    description:
      "We hold no certifications today, including B Corp. We would rather say that than imply otherwise.",
  },
];

export default function SustainabilityPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b border-border bg-muted">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Our commitment
            </p>
            <h1 className="mt-3 text-page-title text-foreground">
              Measured, not promised
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Link Flame is a new, small shop. This page lists what is true
              today and, separately, what we want to do. Numbers live on our{" "}
              <Link href="/impact" className="text-primary underline-offset-4 hover:underline">
                impact page
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* What is true today */}
      <section className="py-16" aria-labelledby="today-heading">
        <div className="container mx-auto px-4">
          <h2
            id="today-heading"
            className="text-section-title text-foreground"
          >
            What is true today
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {today.map((item) => (
              <div key={item.title} className="rounded-xl border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Goals */}
      <section className="bg-muted py-16" aria-labelledby="goals-heading">
        <div className="container mx-auto px-4">
          <h2
            id="goals-heading"
            className="text-section-title text-foreground"
          >
            What we are working toward
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            These are goals, not facts. None of them is done.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {goals.map((item) => (
              <div key={item.title} className="rounded-xl border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-section-title text-foreground">
            See what is for sale
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/products" className="cta-primary">
              Shop
            </Link>
            <Link href="/impact" className="cta-secondary">
              View our impact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
