import { Metadata } from "next";
import Link from "next/link";
import {
  TerraCycleHero,
  RecyclingSteps,
  AcceptedItems,
  TerraCycleFAQ,
} from "@/components/terracycle";

export const metadata: Metadata = {
  title: "TerraCycle Recycling Program | Link Flame",
  description:
    "Join our TerraCycle partnership to recycle your empty product packaging. Free shipping, earn rewards, and track your environmental impact.",
  openGraph: {
    title: "TerraCycle Recycling Program | Link Flame",
    description:
      "Give your empty product packaging a second life with our free TerraCycle recycling program.",
  },
};

// Recycle icon
const RecycleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
    <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
    <path d="m14 16-3 3 3 3" />
    <path d="M8.293 13.596 4.875 8.5l1.753-3" />
    <path d="m9.5 5.5 1.753-3L14.5 5" />
    <path d="m15.5 8.5 4.2 7.28" />
  </svg>
);

// Leaf icon
const LeafIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

// Globe icon
const GlobeIcon = ({ className }: { className?: string }) => (
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
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// Truck icon
const TruckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </svg>
);

// Environmental impact stats
const impactStats = [
  {
    value: "15,000+",
    label: "Items Recycled",
    description: "Product containers given a second life",
  },
  {
    value: "2,500 kg",
    label: "Waste Diverted",
    description: "Kept out of landfills and oceans",
  },
  {
    value: "3,200+",
    label: "Participants",
    description: "Customers making a difference",
  },
  {
    value: "98%",
    label: "Recycling Rate",
    description: "Of materials successfully processed",
  },
];

export default function TerraCyclePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <TerraCycleHero />

      {/* Impact Stats Banner */}
      <section className="bg-emerald-600 py-12 dark:bg-emerald-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {impactStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm font-medium text-emerald-100">
                  {stat.label}
                </div>
                <div className="mt-0.5 text-xs text-emerald-200/80">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <RecyclingSteps />

      {/* Accepted Items Section */}
      <AcceptedItems />

      {/* Why Recycle Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Why Recycling Matters
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Traditional recycling programs cannot process many types of product
                packaging. TerraCycle&apos;s innovative approach ensures that your empties
                do not end up in landfills or our oceans.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/50">
                    <GlobeIcon className="size-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      The Problem
                    </h3>
                    <p className="mt-1 text-muted-foreground">
                      Over 8 million tons of plastic enter our oceans every year.
                      Most cosmetic and cleaning product packaging is not accepted by
                      curbside recycling programs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                    <RecycleIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      The Solution
                    </h3>
                    <p className="mt-1 text-muted-foreground">
                      TerraCycle specializes in recycling hard-to-recycle materials.
                      Their technology can process complex packaging that would
                      otherwise end up in landfills.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                    <LeafIcon className="size-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Your Impact
                    </h3>
                    <p className="mt-1 text-muted-foreground">
                      By participating in our TerraCycle program, you are directly
                      contributing to a circular economy and reducing the demand for
                      virgin plastic production.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual / Stats Card */}
            <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-emerald-50 p-8 dark:from-gray-900 dark:to-emerald-900/30">
              <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
                Environmental Impact Equivalents
              </h3>
              <p className="mb-6 text-muted-foreground">
                Together, our recycling community has achieved the equivalent of:
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: TruckIcon,
                    value: "125",
                    label: "car trips eliminated",
                    description: "in carbon emissions from material production",
                  },
                  {
                    icon: GlobeIcon,
                    value: "3,750",
                    label: "gallons of water saved",
                    description: "by using recycled vs. virgin materials",
                  },
                  {
                    icon: LeafIcon,
                    value: "850",
                    label: "trees worth of CO2",
                    description: "absorbed through waste diversion",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                      <item.icon className="size-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {item.value}
                        </span>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <TerraCycleFAQ />

      {/* Get Started CTA Section */}
      <section
        id="get-started"
        className="bg-gradient-to-b from-emerald-600 to-teal-700 py-20 dark:from-emerald-800 dark:to-teal-900"
      >
        <div className="container mx-auto px-4 text-center">
          <RecycleIcon className="mx-auto mb-6 size-16 text-white/80" />
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Start Recycling?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-100">
            Join thousands of customers who are making a difference. Request your free
            shipping label today and give your empties a second life.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/account/terracycle"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-medium text-emerald-600 shadow-sm transition-colors hover:bg-gray-100"
            >
              Request Shipping Label
            </Link>
            <a
              href="https://www.terracycle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Visit TerraCycle
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>

          {/* Additional Info */}
          <div className="mx-auto mt-12 grid max-w-3xl gap-6 text-left md:grid-cols-3">
            {[
              {
                title: "No Account Needed",
                description:
                  "Guest users can also participate. Create an account to track your impact.",
              },
              {
                title: "Always Free",
                description:
                  "Shipping is always free. We cover all costs for the recycling program.",
              },
              {
                title: "Earn Rewards",
                description:
                  "Get loyalty points for every shipment. Redeem for discounts.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg bg-white/10 p-4 backdrop-blur-sm"
              >
                <h3 className="font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-emerald-100">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
            Learn More About Our Sustainability Efforts
          </h2>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              {
                title: "Our Commitment",
                description:
                  "Learn about our sustainability pillars and environmental certifications.",
                href: "/sustainability",
                color: "green",
              },
              {
                title: "Impact Report",
                description:
                  "View detailed metrics on our environmental impact and progress toward goals.",
                href: "/impact",
                color: "teal",
              },
              {
                title: "Eco-Friendly Products",
                description:
                  "Shop our collection of sustainable, plastic-free, and ethically sourced products.",
                href: "/products",
                color: "emerald",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Learn more
                  <svg
                    className="size-4 transition-transform group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
