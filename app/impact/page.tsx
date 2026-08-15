import { Metadata } from "next";
import Link from "next/link";
import { getCatalogImpact, getCommunityImpact } from "@/lib/impact";
import { CountUp } from "@/components/home/CountUp";

// Reads live impact data; must not be statically rendered at build time
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Environmental Impact",
  description:
    "Every product carries a measured yearly impact versus its single-use equivalent. See the numbers and how we calculate them.",
  openGraph: {
    title: "Our Environmental Impact",
    description:
      "Measured, not promised: per-product impact data and community totals.",
  },
};

const COMMITMENTS = [
  {
    title: "1% for the Planet",
    description:
      "One percent of every sale is pledged to environmental nonprofits, independently verified through onepercentfortheplanet.org.",
  },
  {
    title: "Carbon-neutral shipping",
    description:
      "Shipping emissions on every order are offset at checkout. The offset line appears in your order summary, not in fine print.",
  },
  {
    title: "Plastic-free packaging",
    description:
      "Orders ship in recyclable and compostable materials. No poly mailers, no bubble wrap, no plastic tape.",
  },
  {
    title: "TerraCycle partnership",
    description:
      "Hard-to-recycle empties can be returned through our TerraCycle program instead of going to landfill.",
  },
];

export default async function ImpactPage() {
  const [catalog, community] = await Promise.all([
    getCatalogImpact().catch(() => []),
    getCommunityImpact().catch(() => []),
  ]);

  const communityWithData = community.filter((m) => m.totalValue > 0);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="border-b bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Measured, not promised
            </p>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
              Our environmental impact
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              We don&apos;t publish numbers we can&apos;t stand behind. Every
              figure on this page is either measured per product or summed from
              real orders — and where the honest number is still zero, we say
              so.
            </p>
          </div>
        </div>
      </section>

      {/* Catalog impact */}
      {catalog.length > 0 && (
        <section className="py-16" aria-labelledby="catalog-impact-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2
              id="catalog-impact-heading"
              className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl"
            >
              What one year of the catalogue replaces
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Each product carries a measured yearly impact versus the
              single-use equivalent it replaces. Using one of each product for
              one year adds up to:
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              {catalog.slice(0, 4).map((metric) => (
                <div key={metric.slug} className="border-l-2 border-primary/20 pl-4">
                  <dd className="font-serif text-4xl tabular-nums tracking-tight text-foreground">
                    <CountUp value={metric.total} />
                  </dd>
                  <dt className="mt-2">
                    <span className="block text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {metric.unit}
                    </span>
                    <span className="mt-1 block text-sm text-foreground">
                      {metric.name}
                    </span>
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Community impact */}
      <section className="bg-muted py-16" aria-labelledby="community-impact-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="community-impact-heading"
            className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl"
          >
            What customers have added up to so far
          </h2>
          {communityWithData.length > 0 ? (
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              {communityWithData.slice(0, 4).map((metric) => (
                <div key={metric.slug} className="border-l-2 border-primary/20 pl-4">
                  <dd className="font-serif text-4xl tabular-nums tracking-tight text-foreground">
                    <CountUp value={metric.totalValue} />
                  </dd>
                  <dt className="mt-2">
                    <span className="block text-sm font-medium uppercase tracking-wide text-muted-foreground">
                      {metric.unit}
                    </span>
                    <span className="mt-1 block text-sm text-foreground">
                      {metric.name}
                    </span>
                  </dt>
                </div>
              ))}
            </dl>
          ) : (
            <div className="mt-8 max-w-2xl rounded-lg border border-dashed p-6">
              <p className="font-medium text-foreground">
                The counter starts at zero — honestly.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Community totals are summed from real orders, so this section
                stays empty until the first swap ships. Most impact pages start
                with an impressive number; we&apos;d rather start with a
                truthful one.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Methodology */}
      <section className="py-16" aria-labelledby="methodology-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2
                id="methodology-heading"
                className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl"
              >
                How we measure
              </h2>
              <div className="mt-4 space-y-4 text-muted-foreground">
                <p>
                  Every product in the catalogue is assigned a per-unit yearly
                  impact for each metric it affects: how many plastic bottles a
                  reusable bottle displaces in a year of typical use, how many
                  disposable items a beeswax wrap replaces, how many kilograms
                  of CO&#8322;e the swap avoids.
                </p>
                <p>
                  When an order ships, the products&apos; per-unit values are
                  added to your personal impact and to the community totals
                  above. Nothing is projected, annualized from a pilot, or
                  borrowed from an industry average.
                </p>
                <p>
                  Signed in? Your running total lives in{" "}
                  <Link href="/account" className="text-primary underline-offset-4 hover:underline">
                    your account
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div>
              <h2 className="font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
                Standing commitments
              </h2>
              <ul className="mt-4 space-y-5">
                {COMMITMENTS.map((item) => (
                  <li key={item.title}>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl tracking-tight">
            The numbers only move when you swap something
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            Every product page shows what the swap saves per year. Pick one
            thing you replace often, and start there.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/collections"
              className="inline-flex items-center rounded-lg bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-background/90"
            >
              Shop all products
            </Link>
            <Link
              href="/sustainability"
              className="inline-flex items-center rounded-lg border border-primary-foreground/40 px-6 py-3 text-sm font-medium transition-colors hover:bg-primary-foreground/10"
            >
              Our commitments
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
