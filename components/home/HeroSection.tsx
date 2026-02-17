import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 text-center sm:py-24 lg:py-32">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/leaves.jpg"
          alt="Sustainable living background"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/60" />
      </div>
      <div className="relative z-10">
        <h1 className="text-gradient mb-6 font-serif">
          Empowering Sustainable Living
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Discover eco-friendly solutions and make informed choices for a greener future.
          Join us in creating a sustainable world, one choice at a time.
        </p>
        <div className="mt-12 flex justify-center gap-5">
          <Link href="/guides-and-tips">
            <Button className="modern-button">Explore Eco Living</Button>
          </Link>
          <Link href="/blogs">
            <Button variant="outline" className="modern-button">
              Read Our Blog
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
