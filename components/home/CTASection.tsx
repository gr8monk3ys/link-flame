import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function CTASection() {
  return (
    <section className="section-spacing relative overflow-hidden rounded-3xl bg-primary/5">
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
        <h2 className="text-gradient mb-6">Ready to Make a Difference?</h2>
        <p className="mb-8 text-lg text-muted-foreground">
          Join our community of eco-conscious individuals and start your journey
          towards sustainable living today.
        </p>
        <Button className="modern-button" size="lg">
          Get Started
        </Button>
      </div>
    </section>
  );
}
