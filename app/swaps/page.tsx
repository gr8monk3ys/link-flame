/**
 * Checked swaps: other brands' products, with what could be confirmed and
 * what could not. The entries live in `config/swaps.ts`.
 */
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { SWAPS } from "@/config/swaps"
import {
  formatCheckedDate,
  latestCheckedOn,
  swapIndexDisclosure,
  swapLink,
  swapsByCategory,
} from "@/lib/swaps"

export const metadata: Metadata = {
  title: "Checked swaps",
  description:
    "Reusable and low-waste products from other brands. For each one: what the brand says, what we could confirm, and what is not proven.",
  alternates: { canonical: "/swaps" },
  openGraph: {
    title: "Checked swaps",
    description:
      "Other brands' low-waste products, with what is proven and what is not.",
    type: "website",
  },
}

const METHOD = [
  {
    label: "Step 1",
    title: "Read the brand's page",
    body: "We note the price, the materials and each claim, with the date.",
  },
  {
    label: "Step 2",
    title: "Look for proof",
    body: "We look up each certification in the certifier's own directory, and we look for a published study. A brand's word about itself is not proof.",
  },
  {
    label: "Step 3",
    title: "Say what is missing",
    body: "If we could not confirm a claim, we say so. That does not mean the claim is false.",
  },
  {
    label: "Step 4",
    title: "Date it",
    body: "Prices and pages change. Each entry shows the day we read it.",
  },
] as const

export default function SwapsPage() {
  const groups = swapsByCategory()
  const checked = formatCheckedDate(latestCheckedOn())

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl">
        <p className="label-mono mb-4">
          Checked swaps · {SWAPS.length} products · Checked {checked}
        </p>
        <h1 className="mb-6 text-page-title">Other brands&apos; swaps, checked</h1>
        <p className="mb-4 text-lg text-muted-foreground">
          These products from other brands each replace a single-use item. For each one we read
          the brand&apos;s page, then looked for proof in a certifier&apos;s own listing or a
          published study.
        </p>
        <p className="mb-10 text-muted-foreground">
          We do not sell or ship these products, and we have not tested them. Each page says what
          the brand claims, what we could confirm, and what is not proven.
        </p>

        <p className="label-mono mb-1">Disclosure</p>
        <p className="text-sm text-muted-foreground">{swapIndexDisclosure()}</p>

        <hr className="gallery-rule my-16" />

        <section aria-labelledby="method-heading">
          <p className="label-mono mb-4">Method</p>
          <h2 id="method-heading" className="mb-6 text-section-title">
            How we check
          </h2>
          <ol className="border-t border-border">
            {METHOD.map((step) => (
              <li key={step.label} className="border-b border-border py-5">
                <p className="label-mono mb-1">{step.label}</p>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {groups.map((group, index) => {
          const headingId = `swaps-category-${index}`
          return (
            <div key={group.category}>
              <hr className="gallery-rule my-16" />
              <section aria-labelledby={headingId}>
                <p className="label-mono mb-4">
                  {group.swaps.length} checked
                </p>
                <h2 id={headingId} className="mb-6 text-section-title">
                  {group.category}
                </h2>
                <ul className="border-t border-border">
                  {group.swaps.map((swap) => (
                    <li key={swap.slug} className="border-b border-border">
                      <Link
                        href={`/swaps/${swap.slug}`}
                        className="group flex items-baseline justify-between gap-6 py-5"
                      >
                        <span className="block">
                          <span className="label-mono mb-1 block">
                            {swap.brand}
                            {swapLink(swap).paid ? " · Paid link" : ""}
                          </span>
                          <span className="block text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                            {swap.product}
                          </span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            Replaces: {swap.replaces}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-sm tabular-nums text-foreground">
                          {swap.price}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )
        })}

        <hr className="gallery-rule my-16" />

        <section aria-labelledby="count-heading">
          <p className="label-mono mb-4">Before you buy</p>
          <h2 id="count-heading" className="mb-6 text-section-title">
            Count first
          </h2>
          <p className="mb-8 text-muted-foreground">
            The groups on this page match the tally sheet in our free guide. Count one day of
            waste, then buy the one swap that fits your biggest pile. Do not buy the rest.
          </p>
          <Button asChild variant="outline">
            <Link href="/free-guide">Get the free guide</Link>
          </Button>
          <p className="mt-10 text-sm text-muted-foreground">
            Found a mistake on one of these pages?{" "}
            <Link
              href="/contact"
              className="ink-underline text-foreground transition-colors duration-150 hover:text-primary"
            >
              Tell us
            </Link>{" "}
            and we will read the source again.
          </p>
        </section>
      </div>
    </div>
  )
}
