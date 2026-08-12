import Link from "next/link";
import { getCatalogImpact } from "@/lib/impact";
import { CountUp } from "@/components/home/CountUp";

/**
 * The storefront's signature moment: what a year of the catalogue's swaps
 * replaces, in numbers summed from each product's measured per-unit impact.
 * Renders nothing when there is no impact data — an empty band of zeros
 * would say the opposite of what this section is for.
 */
export async function ImpactBand() {
  let metrics: Awaited<ReturnType<typeof getCatalogImpact>>;
  try {
    metrics = await getCatalogImpact();
  } catch {
    return null;
  }

  const shown = metrics.slice(0, 4);
  if (shown.length === 0) return null;

  return (
    <section
      aria-labelledby="impact-band-heading"
      className="bg-primary text-primary-foreground"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-primary-foreground/70">
            Measured, not promised
          </p>
          <h2
            id="impact-band-heading"
            className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl"
          >
            What a year of swaps adds up to
          </h2>
          <p className="mt-3 text-primary-foreground/80">
            Every product here carries a measured yearly impact versus its
            single-use equivalent. One of each, for one year:
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {shown.map((metric) => (
            <div
              key={metric.slug}
              className="border-l border-primary-foreground/20 pl-4"
            >
              <dd className="font-serif text-4xl tabular-nums tracking-tight sm:text-5xl">
                <CountUp value={metric.total} />
              </dd>
              <dt className="mt-2">
                <span className="block text-sm font-medium uppercase tracking-wide text-primary-foreground/70">
                  {metric.unit}
                </span>
                <span className="mt-1 block text-sm text-primary-foreground/90">
                  {metric.name}
                </span>
              </dt>
            </div>
          ))}
        </dl>

        <Link
          href="/impact"
          className="mt-10 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          See how we measure this
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

export default ImpactBand;
