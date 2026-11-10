import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

/**
 * The two ways to buy from Link Flame. Both link to the catalogue, which is
 * the source of truth for what is for sale.
 */
const WAYS_TO_SHOP = [
  { href: "/products", label: "Digital guides", note: "PDF guides with instant download, from $7" },
  { href: "/products", label: "Printed to order", note: "An organic cotton tote and tee, made after you order" },
];

export default function HeroSection() {
  return (
    <section className="pb-16 pt-8 sm:pt-12 lg:pb-20 lg:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-primary">
            Guides and goods for low-waste living
          </p>

          <h1 className="mt-5 font-serif text-[clamp(2.75rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-tight">
            Everyday essentials,
            <span className="block text-primary">minus the plastic.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Practical PDF guides for swapping out single-use things, plus an
            organic cotton tote and tee printed to order. Everything here is
            our own.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/products">Shop all products</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sustainability">What we stand for</Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted shadow-warm-lg sm:aspect-3/2">
            {/* Largest element in the mobile viewport, so it is the LCP
                candidate. `preload` (Next 16's name for `priority`) emits the
                <link rel="preload">; `fetchPriority="high"` is what moves the
                request ahead of the font and script queue, and Next 16 no
                longer sets it for you. `sizes` mirrors the real layout: full
                container width below lg (the container has 1rem side
                padding), ~55% of the 1400px-capped container above it. */}
            <Image
              src="/images/products/guide-swap-starter-set.png"
              alt="The Swap Starter Set, a bundle of three PDF guides"
              fill
              sizes="(max-width: 1023px) calc(100vw - 2rem), (max-width: 1400px) 55vw, 770px"
              className="object-cover"
              preload
              fetchPriority="high"
            />
          </div>
        </div>
      </div>

      <div className="mt-14 lg:mt-20">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            Two ways to shop
          </h2>
          <Link
            href="/products"
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {WAYS_TO_SHOP.map((value) => (
            <li key={value.label}>
              <Link
                href={value.href}
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/45 hover:bg-accent"
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
