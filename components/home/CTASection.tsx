import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function CTASection() {
  return (
    <section className="section-spacing relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary/60 via-secondary/30 to-accent/10">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/wall-hanger-plant.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-10"
        />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="mb-6 font-serif text-foreground">
          Not sure where to start?
        </h2>
        <p className="mb-8 text-lg text-muted-foreground">
          Most people begin with one swap, not twenty. Answer four questions and
          we&rsquo;ll point you at the three products worth changing first.
        </p>
        <Button
          asChild
          className="modern-button bg-accent text-accent-foreground hover:bg-accent/90"
          size="lg"
        >
          <Link href="/quiz">Take the 2-minute quiz</Link>
        </Button>
      </div>
    </section>
  );
}
