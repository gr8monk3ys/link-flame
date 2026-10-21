import Link from "next/link";
import { Button } from "@/components/ui/button";

// Hairline above and below, one title, one primary button. The honey
// light-sweep button and the gradient wash are gone (DESIGN.md →
// Colors → The One Pen Rule). PR (c) recomposes the page around it.
export default function CTASection() {
  return (
    <section className="border-y border-border py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="label-mono mb-4">The quiz</p>
        <h2 className="mb-6 text-section-title">Not sure where to start?</h2>
        <p className="mb-8 text-lg text-muted-foreground">
          Most people begin with one swap, not twenty. Answer four questions and
          we&rsquo;ll point you at the three products worth changing first.
        </p>
        <Button asChild size="lg">
          <Link href="/quiz">Take the 2-minute quiz</Link>
        </Button>
      </div>
    </section>
  );
}
