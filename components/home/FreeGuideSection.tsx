import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FREE_GUIDE } from "@/config/free-guide";

// The free guide is the first thing a new visitor can take without paying.
// Same shape as CTASection: one label, one title, one line, one action. The
// action is an outline button because the hero already holds the page's
// primary one (DESIGN.md → Colors → The One Pen Rule).
export default function FreeGuideSection() {
  return (
    <section className="border-t border-border py-14 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <p className="label-mono mb-4">
          Free guide · PDF · {FREE_GUIDE.pages} pages
        </p>
        <h2 className="mb-6 text-section-title">Count before you buy</h2>
        <p className="mb-8 text-lg text-muted-foreground">
          {FREE_GUIDE.title} is a one-day tally sheet. It shows which items your
          household throws away most, so the first change you make is one you
          will use.
        </p>
        <Button asChild variant="outline" size="lg">
          <Link href="/free-guide">Get the free guide</Link>
        </Button>
      </div>
    </section>
  );
}
