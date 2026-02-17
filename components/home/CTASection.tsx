import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function CTASection() {
  return (
    <section className="section-spacing relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary/60 via-secondary/30 to-accent/10">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/wall-hanger-plant.jpg"
          alt="Sustainable living"
          fill
          className="object-cover opacity-10"
          priority
        />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="text-gradient mb-6 font-serif">Ready to Make a Difference?</h2>
        <p className="mb-8 text-lg text-muted-foreground">
          Join our community of eco-conscious individuals and start your journey
          towards sustainable living today.
        </p>
        <Link href="/collections">
          <Button
            className="modern-button bg-accent text-accent-foreground hover:bg-accent/90"
            size="lg"
          >
            Get Started
          </Button>
        </Link>
      </div>
    </section>
  );
}
