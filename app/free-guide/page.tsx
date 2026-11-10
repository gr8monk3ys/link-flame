import type { Metadata } from "next"
import Link from "next/link"
import { FreeGuideForm } from "@/components/free-guide/free-guide-form"
import { Button } from "@/components/ui/button"
import { FREE_GUIDE } from "@/config/free-guide"

export const metadata: Metadata = {
  title: `Free guide: ${FREE_GUIDE.title}`,
  description:
    "A free 10-page PDF. Count what your household throws away for one day, then pick one thing to change. No scale, no sorting, no shopping list.",
  alternates: { canonical: "/free-guide" },
  openGraph: {
    title: `Free guide: ${FREE_GUIDE.title}`,
    description: FREE_GUIDE.summary,
    type: "article",
  },
}

const CHAPTERS = [
  {
    label: "Part 1",
    title: "Read this first",
    description: "What one day of counting can tell you, and what it cannot.",
  },
  {
    label: "Part 2",
    title: "How to count",
    description:
      "Four rules: mark at the moment you throw it away, count items, count every bin, count the whole household.",
  },
  {
    label: "Part 3",
    title: "Your one-day tally",
    description:
      "The sheet itself. Eight rows, from food packaging to takeout. Print it or fill it in on a tablet.",
  },
  {
    label: "Part 4",
    title: "Read your day",
    description: "Find your two biggest rows and ask three questions about the top one.",
  },
  {
    label: "Part 5",
    title: "One thing to try this week",
    description: "A seven-day trial that starts with what you already own.",
  },
  {
    label: "Part 6",
    title: "What a full week adds",
    description: "Why seven days of counting is a better sample than one.",
  },
] as const

const LIMITS = [
  "One day is a small sample. It misses the weekly shop, the takeout night and anything you buy once a month.",
  "The guide does not tell you how much your waste weighs.",
  "The guide does not tell you how much carbon a change saves.",
] as const

const NEEDS = [
  { label: "The sheet", value: "Printed, or open on a tablet" },
  { label: "A pen", value: "Kept where the trash is" },
  { label: "One day", value: "A day that looks roughly normal" },
] as const

export default function FreeGuidePage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl">
        <p className="label-mono mb-4">
          Free guide · PDF · {FREE_GUIDE.pages} pages
        </p>
        <h1 className="mb-6 text-page-title">{FREE_GUIDE.title}</h1>
        <p className="mb-4 text-lg text-muted-foreground">
          Most people begin a low-waste routine by buying something. This guide
          does the opposite. You count first. You buy later, and only if the
          count says to.
        </p>
        <p className="mb-10 text-muted-foreground">
          The method takes one day and a pen. Each time something goes into the
          trash, the recycling or the compost, you make one mark on the sheet.
          You do not sort through garbage. You do not weigh anything. A mark
          takes about five seconds.
        </p>

        <FreeGuideForm />

        <hr className="gallery-rule my-16" />

        <section aria-labelledby="inside-heading">
          <p className="label-mono mb-4">Contents</p>
          <h2 id="inside-heading" className="mb-6 text-section-title">
            What is inside
          </h2>
          <ol className="border-t border-border">
            {CHAPTERS.map((chapter) => (
              <li key={chapter.title} className="border-b border-border py-5">
                <p className="label-mono mb-1">{chapter.label}</p>
                <h3 className="text-base font-semibold text-foreground">
                  {chapter.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {chapter.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <hr className="gallery-rule my-16" />

        <section aria-labelledby="needs-heading">
          <p className="label-mono mb-4">Before you start</p>
          <h2 id="needs-heading" className="mb-6 text-section-title">
            What you need
          </h2>
          <dl className="font-mono text-sm">
            {NEEDS.map((need) => (
              <div
                key={need.label}
                className="flex justify-between gap-6 border-b border-border py-2"
              >
                <dt className="label-mono">{need.label}</dt>
                <dd className="text-right">{need.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <hr className="gallery-rule my-16" />

        <section aria-labelledby="limits-heading">
          <p className="label-mono mb-4">Limits</p>
          <h2 id="limits-heading" className="mb-6 text-section-title">
            What one day cannot tell you
          </h2>
          <ul className="border-t border-border">
            {LIMITS.map((limit) => (
              <li
                key={limit}
                className="border-b border-border py-4 text-muted-foreground"
              >
                {limit}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-muted-foreground">
            One day shows you which kinds of items repeat. That is enough to
            pick one thing to try this week.
          </p>
        </section>

        <hr className="gallery-rule my-16" />

        <section aria-labelledby="next-heading">
          <p className="label-mono mb-4">After the first count</p>
          <h2 id="next-heading" className="mb-6 text-section-title">
            Want the full week?
          </h2>
          <p className="mb-8 text-muted-foreground">
            The Waste Audit Workbook is the paid follow-up. It has seven daily
            tally sheets, a weekly summary, a ranking worksheet and a page for
            a second audit 90 days later. You do not need it to use the free
            guide.
          </p>
          <Button asChild variant="outline">
            <Link href="/collections?category=Guides">See the paid guides</Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
