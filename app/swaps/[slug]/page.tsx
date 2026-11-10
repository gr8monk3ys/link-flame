/**
 * One checked swap. Prerendered from `config/swaps.ts`; unknown slugs 404.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { SWAPS, type SwapFinding } from "@/config/swaps"
import {
  formatCheckedDate,
  getSwap,
  sourceHost,
  swapLink,
  swapPageDisclosure,
} from "@/lib/swaps"
import type { PageProps } from "@/types/next"

export const dynamicParams = false

export function generateStaticParams() {
  return SWAPS.map((swap) => ({ slug: swap.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<{ slug: string }>): Promise<Metadata> {
  const { slug } = await params
  const swap = getSwap(slug)
  if (!swap) return { title: "Swap not found" }

  const title = `${swap.brand} ${swap.product}, checked`
  const description = `What ${swap.brand} says about this product, what we could confirm, and what is not proven. Checked ${formatCheckedDate(swap.checkedOn)}.`
  return {
    title,
    description,
    alternates: { canonical: `/swaps/${swap.slug}` },
    openGraph: { title, description, type: "article" },
  }
}

const SOURCE_KIND_LABEL = {
  brand: "Brand page",
  certifier: "Certifier",
  study: "Study or guidance",
} as const

const SOURCE_LINK_CLASS =
  "ink-underline label-link text-muted-foreground transition-colors duration-150 hover:text-primary"

function Finding({ finding }: { finding: SwapFinding }) {
  return (
    <li className="border-b border-border py-4">
      <p className="text-muted-foreground">{finding.text}</p>
      {finding.sourceUrl ? (
        <p className="mt-2">
          <a href={finding.sourceUrl} rel="noopener" className={SOURCE_LINK_CLASS}>
            Source: {sourceHost(finding.sourceUrl)}
          </a>
        </p>
      ) : null}
    </li>
  )
}

export default async function SwapPage({ params }: PageProps<{ slug: string }>) {
  const { slug } = await params
  const swap = getSwap(slug)
  if (!swap) notFound()

  const link = swapLink(swap)
  const checked = formatCheckedDate(swap.checkedOn)

  return (
    <div className="container py-16">
      <article className="mx-auto max-w-2xl">
        <p className="mb-8">
          <Link
            href="/swaps"
            className="label-link text-muted-foreground transition-colors duration-150 hover:text-primary"
          >
            All checked swaps
          </Link>
        </p>

        <p className="label-mono mb-4">
          {swap.category} · Checked {checked}
        </p>
        <h1 className="mb-6 text-page-title">
          {swap.brand} {swap.product}
        </h1>
        <p className="mb-10 text-lg text-muted-foreground">
          We do not sell or ship this product, and we have not tested it. This page is a check of
          the brand&apos;s claims against certifiers&apos; listings and published studies.
        </p>

        {swap.limited ? (
          <div className="mb-10 border-y border-border py-5">
            <p className="label-mono mb-1">Incomplete check</p>
            <p className="text-muted-foreground">{swap.limited}</p>
          </div>
        ) : null}

        <dl className="mb-10 border-t border-border text-sm">
          <div className="flex justify-between gap-6 border-b border-border py-3">
            <dt className="label-mono shrink-0">Replaces</dt>
            <dd className="text-right">{swap.replaces}</dd>
          </div>
          <div className="flex justify-between gap-6 border-b border-border py-3">
            <dt className="label-mono shrink-0">Price</dt>
            <dd className="text-right">
              <span className="font-mono tabular-nums">{swap.price}</span>
              <span className="mt-1 block text-muted-foreground">
                Read on {checked}. {swap.priceNote ? `${swap.priceNote} ` : ""}It may have changed.
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-6 border-b border-border py-3">
            <dt className="label-mono shrink-0">Materials</dt>
            <dd className="text-right">{swap.materials}</dd>
          </div>
          <div className="flex justify-between gap-6 border-b border-border py-3">
            <dt className="label-mono shrink-0">End of life</dt>
            <dd className="text-right">{swap.endOfLife}</dd>
          </div>
        </dl>

        <p className="label-mono mb-3">{link.paid ? "Paid link" : "Link · Not paid"}</p>
        <Button asChild>
          <a href={link.href} rel={link.rel}>
            See it at {swap.brand}
          </a>
        </Button>
        <p className="mt-3 text-sm text-muted-foreground">{swapPageDisclosure(swap)}</p>

        <hr className="gallery-rule my-16" />

        <section aria-labelledby="claims-heading">
          <p className="label-mono mb-4">Claims</p>
          <h2 id="claims-heading" className="mb-6 text-section-title">
            What the brand says
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            These are the brand&apos;s claims in our words. They are not our findings.
          </p>
          <ul className="border-t border-border">
            {swap.brandClaims.map((claim) => (
              <li key={claim} className="border-b border-border py-4 text-muted-foreground">
                {claim}
              </li>
            ))}
          </ul>
        </section>

        <hr className="gallery-rule my-16" />

        <section aria-labelledby="confirmed-heading">
          <p className="label-mono mb-4">Confirmed · {swap.confirmed.length}</p>
          <h2 id="confirmed-heading" className="mb-6 text-section-title">
            What we could confirm
          </h2>
          {swap.confirmed.length > 0 ? (
            <ul className="border-t border-border">
              {swap.confirmed.map((finding) => (
                <Finding key={finding.text} finding={finding} />
              ))}
            </ul>
          ) : (
            <p className="border-y border-border py-4 text-muted-foreground">
              Nothing yet. We found no certifier listing or published study that confirms a claim
              on the brand&apos;s page. That does not mean the claims are false.
            </p>
          )}
          <p className="mt-6 text-sm text-muted-foreground">
            A B Corp or climate certification covers the company, not this one product.
          </p>
        </section>

        <hr className="gallery-rule my-16" />

        <section aria-labelledby="open-heading">
          <p className="label-mono mb-4">Open questions · {swap.notProven.length}</p>
          <h2 id="open-heading" className="mb-6 text-section-title">
            What is not proven
          </h2>
          <ul className="border-t border-border">
            {swap.notProven.map((finding) => (
              <Finding key={finding.text} finding={finding} />
            ))}
          </ul>
        </section>

        <hr className="gallery-rule my-16" />

        <section aria-labelledby="sources-heading">
          <p className="label-mono mb-4">Sources · Read {checked}</p>
          <h2 id="sources-heading" className="mb-6 text-section-title">
            Where this comes from
          </h2>
          <ul className="border-t border-border">
            {swap.sources.map((source) => (
              <li key={source.url} className="border-b border-border py-4">
                <p className="label-mono mb-1">{SOURCE_KIND_LABEL[source.kind]}</p>
                <a
                  href={source.url}
                  rel="noopener"
                  className="ink-underline text-foreground transition-colors duration-150 hover:text-primary"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            Found a mistake?{" "}
            <Link
              href="/contact"
              className="ink-underline text-foreground transition-colors duration-150 hover:text-primary"
            >
              Tell us
            </Link>{" "}
            and we will read the source again.
          </p>
        </section>
      </article>
    </div>
  )
}
