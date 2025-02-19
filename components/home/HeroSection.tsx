import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="section-spacing relative text-center">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/leaves.jpg"
          alt="Sustainable living background"
          fill
          className="object-cover opacity-20"
          priority
        />
      </div>
      <div className="relative z-10">
        <h1 className="text-gradient mb-6">
          Empowering Sustainable Living
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Discover eco-friendly solutions and make informed choices for a greener future.
          Join us in creating a sustainable world, one choice at a time.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link href="/zero-waste">
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
