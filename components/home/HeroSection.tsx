import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

/**
 * Entry points backed by real ProductValue slugs. The products API filters on
 * `?values=<slug>` (OR logic), so each tile lands on a populated grid.
 *
 * These four are the only values with a non-zero productCount today
 * (/api/products/values: plastic-free 14, zero-waste 12, vegan 5,
 * cruelty-free 3). Women-owned, Black-owned, and Small Business all return 0,
 * so linking to them would drop shoppers on an empty grid.
 */
const SHOP_BY_VALUE = [
  { slug: "plastic-free", label: "Plastic-free", note: "No plastic in the product or the box" },
  { slug: "zero-waste", label: "Zero-waste", note: "Refillable, compostable, or endlessly reusable" },
  { slug: "vegan", label: "Vegan", note: "No animal-derived ingredients" },
  { slug: "cruelty-free", label: "Cruelty-free", note: "Never tested on animals" },
];

export default function HeroSection() {
  return (
    <section className="pb-16 pt-8 sm:pt-12 lg:pb-20 lg:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-primary">
            1% for the Planet member
          </p>

          <h1 className="mt-5 font-serif text-[clamp(2.75rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-tight">
            Everyday essentials,
            <span className="block text-primary">minus the plastic.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Bar soap, refills, and swaps built to outlast the thing they replace.
            Every product is screened for what it&rsquo;s made of and who made it.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/products">Shop all products</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/quiz">Take the 2-minute quiz</Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary shadow-warm-lg sm:aspect-[3/2]">
            <Image
              src="/images/soap-bars.jpg"
              alt="Stacked bars of plastic-free soap"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      <div className="mt-14 lg:mt-20">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            Shop by what matters to you
          </h2>
          <Link
            href="/products"
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SHOP_BY_VALUE.map((value) => (
            <li key={value.slug}>
              <Link
                href={`/products?values=${value.slug}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="font-medium tracking-tight">{value.label}</span>
                <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {value.note}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
