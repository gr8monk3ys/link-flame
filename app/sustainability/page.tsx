import { Metadata } from "next";
import Link from "next/link";
import { CarbonNeutralBanner, SustainabilityCommitment } from "@/components/sustainability";

export const metadata: Metadata = {
  title: "Our Sustainability Commitment | Link Flame",
  description: "Learn about Link Flame's commitment to environmental sustainability, carbon-neutral shipping, and ethical sourcing practices.",
  openGraph: {
    title: "Our Sustainability Commitment | Link Flame",
    description: "Discover how we're working to protect our planet through sustainable practices and eco-friendly products.",
  },
};

// Leaf icon
const LeafIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

// Check icon
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const certificationPartners = [
  {
    name: "1% for the Planet",
    description: "We donate 1% of annual sales to environmental nonprofits working to protect our planet.",
    logo: "/images/certifications/one-percent-planet.svg",
    link: "https://www.onepercentfortheplanet.org/",
  },
  {
    name: "Climate Neutral Certified",
    description: "We measure and offset 100% of our carbon emissions from operations and shipping.",
    logo: "/images/certifications/climate-neutral.svg",
    link: "https://www.climateneutral.org/",
  },
  {
    name: "B Corp Pending",
    description: "We're in the process of becoming a Certified B Corporation, meeting rigorous standards of social and environmental performance.",
    logo: "/images/certifications/b-corp.svg",
    link: "https://www.bcorporation.net/",
  },
];

const sustainabilityPillars = [
  {
    title: "Carbon-Neutral Shipping",
    description: "Every order ships carbon-neutral. We calculate the carbon footprint of each shipment and purchase verified carbon credits to offset emissions completely.",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
        <circle cx="17" cy="18" r="2" />
        <circle cx="7" cy="18" r="2" />
      </svg>
    ),
    stats: "100% carbon offset",
  },
  {
    title: "Plastic-Free Packaging",
    description: "We've eliminated single-use plastic from our supply chain. All packaging is made from recycled, recyclable, or compostable materials.",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
        <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
        <path d="m14 16-3 3 3 3" />
      </svg>
    ),
    stats: "Zero plastic packaging",
  },
  {
    title: "Ethical Sourcing",
    description: "We partner only with suppliers who share our commitment to fair labor practices, sustainable manufacturing, and environmental responsibility.",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a10 10 0 1 0 10 10H12V2Z" />
        <path d="M12 12 8 8" />
        <path d="M12 2v10h10" />
      </svg>
    ),
    stats: "100% vetted suppliers",
  },
  {
    title: "Product Lifecycle",
    description: "We prioritize products that are durable, repairable, and recyclable. Our goal is to extend product lifespans and reduce waste.",
    icon: (
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    stats: "Built to last",
  },
];

const impactStats = [
  { value: "50K+", label: "kg CO2 offset" },
  { value: "10K+", label: "plastic-free orders" },
  { value: "1%", label: "of sales donated" },
  { value: "100%", label: "renewable energy" },
];

export default function SustainabilityPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-green-50 to-white py-20 dark:from-green-900/20 dark:to-background lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300">
              <LeafIcon className="size-4" />
              Our Commitment
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              Building a More{" "}
              <span className="text-green-600 dark:text-green-400">Sustainable</span>{" "}
              Future
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              At Link Flame, sustainability isn't just a buzzword - it's the foundation of everything
              we do. From the products we sell to how we ship them, we're committed to minimizing
              our environmental impact.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="bg-green-600 py-12 dark:bg-green-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {impactStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Our Sustainability Pillars
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              These four pillars guide every decision we make as a company.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {sustainabilityPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
                    {pillar.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {pillar.title}
                      </h3>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {pillar.stats}
                      </span>
                    </div>
                    <p className="mt-2 text-muted-foreground">{pillar.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carbon Neutral Section */}
      <section className="bg-gray-50 py-20 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Carbon-Neutral From Day One
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Climate change is the defining challenge of our time. That's why we've committed
                to carbon-neutral operations since our founding.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "100% of shipping emissions offset through verified projects",
                  "Renewable energy powers our operations",
                  "Partners held to same environmental standards",
                  "Transparent reporting on our carbon footprint",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckIcon className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/impact"
                  className="inline-flex items-center gap-2 font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  View our impact report
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            <div>
              <CarbonNeutralBanner showLearnMore={false} />
            </div>
          </div>
        </div>
      </section>

      {/* TerraCycle Partnership Section */}
      <section className="bg-emerald-50 py-20 dark:bg-emerald-900/20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
                  <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
                  <path d="m14 16-3 3 3 3" />
                </svg>
                Recycling Partnership
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                TerraCycle Recycling Program
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We have partnered with TerraCycle to ensure your empty product packaging does not end up
                in landfills. Through our free recycling program, you can send back your empties to be
                recycled and upcycled into new products.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Free prepaid shipping labels",
                  "Earn loyalty points for recycling",
                  "Track your environmental impact",
                  "100% of materials recycled or upcycled",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckIcon className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/terracycle"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                  Learn About TerraCycle
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white shadow-xl">
                <h3 className="mb-6 text-2xl font-bold">Program Impact</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-400/30 py-3">
                    <span className="text-emerald-100">Items Recycled</span>
                    <span className="text-2xl font-bold">15,000+</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-emerald-400/30 py-3">
                    <span className="text-emerald-100">Waste Diverted</span>
                    <span className="text-2xl font-bold">2,500 kg</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-emerald-400/30 py-3">
                    <span className="text-emerald-100">Participants</span>
                    <span className="text-2xl font-bold">3,200+</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-emerald-100">Recycling Rate</span>
                    <span className="text-2xl font-bold">98%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certification Partners */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Our Certification Partners
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              We work with leading environmental organizations to verify and improve our practices.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {certificationPartners.map((partner) => (
              <div
                key={partner.name}
                className="rounded-xl border bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30">
                  <LeafIcon className="size-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {partner.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{partner.description}</p>
                <a
                  href={partner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400"
                >
                  Learn more
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 py-20 dark:bg-green-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join Us in Making a Difference
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-green-100">
            Every purchase you make supports our mission to protect the planet.
            Shop sustainably and make your voice heard.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-medium text-green-600 shadow-sm transition-colors hover:bg-gray-100"
            >
              Shop Sustainable Products
            </Link>
            <Link
              href="/impact"
              className="inline-flex items-center rounded-lg border border-white px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              View Our Impact
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
